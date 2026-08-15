import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { canAuthorCourse } from '../helpers/course-access';
import { hasPermission, requirePermission } from '../helpers/require-permission';
import { isUuid } from '../helpers/values';
import { CoursesContentRepository } from '../repositories/courses-content.repository';
import { CoursesRepository } from '../repositories/courses.repository';
import {
  PublicQuestion,
  QuestionAuthoringAccess,
  QuestionOptionInput,
  QuestionsRepository,
} from '../repositories/questions.repository';

@Injectable()
export class QuestionsService {
  constructor(
    private readonly questions: QuestionsRepository,
    private readonly courses: CoursesRepository,
    private readonly content: CoursesContentRepository,
  ) {}

  async list(
    actor: AuthUser,
    filters: {
      sectionId: string | undefined;
      courseId: string | undefined;
      topicId: string | undefined;
      bloomLevelId: number | undefined;
      difficultyLevelId: number | undefined;
      questionFormatId: number | undefined;
      status: string | undefined;
    },
  ) {
    requirePermission(actor, ['question.create']);
    if (
      (filters.sectionId !== undefined && isUuid(filters.sectionId) === false) ||
      (filters.courseId !== undefined && isUuid(filters.courseId) === false) ||
      (filters.topicId !== undefined && isUuid(filters.topicId) === false)
    ) {
      return { items: [] };
    }
    const items = await this.questions.list(filters, this.authoringAccess(actor));
    return { items };
  }

  async getOne(actor: AuthUser, questionId: string) {
    requirePermission(actor, ['question.update', 'question.create']);
    const question = await this.requireQuestion(questionId);
    await this.requireAuthoring(actor, question.courseId);
    return question;
  }

  async create(
    actor: AuthUser,
    input: {
      courseSectionId: string;
      questionFormatId: number;
      prompt: string;
      bloomLevelId: number;
      difficultyLevelId: number;
      baseDifficulty: number;
      topicIds: string[] | undefined;
      options: QuestionOptionInput[] | undefined;
    },
  ) {
    requirePermission(actor, ['question.create']);
    const section = await this.content.findSectionById(input.courseSectionId);
    if (section === undefined) {
      throw new NotFoundException('Section not found');
    }
    await this.requireAuthoring(actor, section.courseId);
    const options = input.options === undefined ? [] : input.options;
    this.requireValidOptions(options);
    const topicIds = input.topicIds === undefined ? [] : input.topicIds;
    await this.requireTopicsOnCourse(section.courseId, topicIds);
    const questionId = await this.questions.insert({
      courseSectionId: input.courseSectionId,
      questionFormatId: input.questionFormatId,
      prompt: input.prompt,
      bloomLevelId: input.bloomLevelId,
      difficultyLevelId: input.difficultyLevelId,
      baseDifficulty: input.baseDifficulty,
      createdBy: actor.id,
      options,
      topicIds,
    });
    return this.requireQuestion(questionId);
  }

  async update(
    actor: AuthUser,
    questionId: string,
    input: {
      courseSectionId: string | undefined;
      prompt: string | undefined;
      questionFormatId: number | undefined;
      bloomLevelId: number | undefined;
      difficultyLevelId: number | undefined;
      baseDifficulty: number | undefined;
      options: QuestionOptionInput[] | undefined;
    },
  ) {
    requirePermission(actor, ['question.update']);
    const question = await this.requireQuestion(questionId);
    await this.requireAuthoring(actor, question.courseId);
    if (input.courseSectionId !== undefined) {
      const section = await this.content.findSectionById(input.courseSectionId);
      if (section === undefined) {
        throw new NotFoundException('Section not found');
      }
      if (section.courseId !== question.courseId) {
        throw new ForbiddenException(
          'Section must belong to the same course as the question',
        );
      }
    }
    await this.questions.updateFields(questionId, {
      courseSectionId: input.courseSectionId,
      prompt: input.prompt,
      questionFormatId: input.questionFormatId,
      bloomLevelId: input.bloomLevelId,
      difficultyLevelId: input.difficultyLevelId,
      baseDifficulty: input.baseDifficulty,
    });
    if (input.options !== undefined) {
      this.requireValidOptions(input.options);
      const usedInAttempts = await this.questions.hasAttemptItems(questionId);
      if (usedInAttempts) {
        throw new ConflictException(
          'Cannot replace options after the question has been used in a quiz',
        );
      }
      await this.questions.replaceOptions(questionId, input.options);
    }
    return this.requireQuestion(questionId);
  }

  async replaceTopics(
    actor: AuthUser,
    questionId: string,
    topicIds: string[],
  ) {
    requirePermission(actor, ['question.metadata.tag']);
    const question = await this.requireQuestion(questionId);
    await this.requireAuthoring(actor, question.courseId);
    await this.requireTopicsOnCourse(question.courseId, topicIds);
    await this.questions.replaceTopics(questionId, topicIds);
    return this.requireQuestion(questionId);
  }

  async setStatus(
    actor: AuthUser,
    questionId: string,
    statusCode: 'active' | 'deactivated',
  ) {
    if (statusCode === 'deactivated') {
      requirePermission(actor, ['question.delete']);
    } else {
      requirePermission(actor, ['question.update']);
    }
    const question = await this.requireQuestion(questionId);
    await this.requireAuthoring(actor, question.courseId);
    await this.questions.setStatus(questionId, statusCode);
    return this.requireQuestion(questionId);
  }

  private authoringAccess(actor: AuthUser): QuestionAuthoringAccess {
    return {
      includeCommunity: hasPermission(actor, ['course.community.update']),
      privateOrganizationId: hasPermission(actor, ['course.private.update'])
        ? actor.organizationId
        : undefined,
    };
  }

  private async requireQuestion(questionId: string): Promise<PublicQuestion> {
    const question = await this.questions.findById(questionId);
    if (question === undefined) {
      throw new NotFoundException('Question not found');
    }
    return question;
  }

  private async requireAuthoring(actor: AuthUser, courseId: string) {
    const course = await this.courses.findById(courseId);
    if (course === undefined) {
      throw new NotFoundException('Course not found');
    }
    if (canAuthorCourse(actor, course) === false) {
      throw new ForbiddenException('Missing permission to author this course');
    }
  }

  private requireValidOptions(options: QuestionOptionInput[]) {
    if (options.length === 0) {
      return;
    }
    const hasCorrect = options.some((option) => option.isCorrect);
    if (hasCorrect === false) {
      throw new BadRequestException('At least one option must be correct');
    }
  }

  private async requireTopicsOnCourse(courseId: string, topicIds: string[]) {
    if (topicIds.length === 0) {
      return;
    }
    const topics = await this.content.listTopics(courseId);
    for (const topicId of topicIds) {
      if (isUuid(topicId) === false) {
        throw new BadRequestException(
          'Each topic must belong to the same course as the question',
        );
      }
      const match = topics.find((topic) => topic.id === topicId);
      if (match === undefined) {
        throw new BadRequestException(
          'Each topic must belong to the same course as the question',
        );
      }
    }
  }
}
