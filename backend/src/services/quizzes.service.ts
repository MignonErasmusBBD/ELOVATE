import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { hasPermission, requirePermission } from '../helpers/require-permission';
import { EnrollmentsRepository } from '../repositories/enrollments.repository';
import { CoursesRepository } from '../repositories/courses.repository';
import {
  GeneratedQuestion,
  PublicAttempt,
  QuizzesRepository,
} from '../repositories/quizzes.repository';
import { QuestionsRepository } from '../repositories/questions.repository';

@Injectable()
export class QuizzesService {
  constructor(
    private readonly quizzes: QuizzesRepository,
    private readonly enrollments: EnrollmentsRepository,
    private readonly questions: QuestionsRepository,
    private readonly courses: CoursesRepository,
  ) {}

  async generate(actor: AuthUser, courseId: string) {
    requirePermission(actor, ['quiz.attempt']);
    const course = await this.courses.findById(courseId);
    if (course === undefined || course.status !== 'active') {
      throw new NotFoundException('Course not found');
    }
    const enrolled = await this.enrollments.hasActiveEnrollment(
      actor.id,
      courseId,
    );
    if (enrolled === false) {
      throw new ForbiddenException(
        'An active enrollment is required to generate a quiz',
      );
    }
    const selected = await this.questions.listActiveForCourse(courseId);
    if (selected.length === 0) {
      throw new ConflictException('No active questions in this course');
    }
    const generated: GeneratedQuestion[] = selected.map((question) => ({
      id: question.id,
      prompt: question.prompt,
      bloomLevelId: question.bloomLevelId,
      difficultyLevelId: question.difficultyLevelId,
      topicIds: question.topicIds,
    }));
    const rating = await this.quizzes.currentRating(actor.id, courseId);
    const attemptId = await this.quizzes.insertGenerated({
      userId: actor.id,
      courseId,
      ratingAtGeneration: rating,
      questions: generated,
    });
    return this.requireAttempt(attemptId);
  }

  async listOwn(
    actor: AuthUser,
    filters: { courseId: string | undefined; status: string | undefined },
  ) {
    requirePermission(actor, ['quiz.read.self']);
    const items = await this.quizzes.list({
      userId: actor.id,
      organizationId: undefined,
      courseId: filters.courseId,
      status: filters.status,
    });
    return { items };
  }

  async listForOrganization(
    actor: AuthUser,
    filters: {
      organizationId: string | undefined;
      courseId: string | undefined;
      userId: string | undefined;
      status: string | undefined;
    },
  ) {
    requirePermission(actor, ['quiz.read.org']);
    if (
      filters.organizationId !== undefined &&
      filters.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException(
        'Can only list attempts in your own organisation',
      );
    }
    const items = await this.quizzes.list({
      userId: filters.userId,
      organizationId: actor.organizationId,
      courseId: filters.courseId,
      status: filters.status,
    });
    return { items };
  }

  async getOne(actor: AuthUser, attemptId: string) {
    const attempt = await this.requireAttempt(attemptId);
    this.requireRead(actor, attempt);
    return attempt;
  }

  async start(actor: AuthUser, attemptId: string) {
    requirePermission(actor, ['quiz.attempt']);
    const attempt = await this.requireAttempt(attemptId);
    if (attempt.userId !== actor.id) {
      throw new ForbiddenException('Can only start your own attempt');
    }
    if (attempt.status !== 'generated') {
      throw new ConflictException('Attempt has already been started');
    }
    await this.quizzes.start(attemptId);
    return this.requireAttempt(attemptId);
  }

  async answer(
    actor: AuthUser,
    attemptId: string,
    quizAttemptItemId: string,
    selectedOptionId: string,
  ) {
    requirePermission(actor, ['quiz.attempt']);
    const attempt = await this.requireAttempt(attemptId);
    if (attempt.userId !== actor.id) {
      throw new ForbiddenException('Can only answer your own attempt');
    }
    if (attempt.status !== 'in_progress') {
      throw new ConflictException('Attempt is not in progress');
    }
    const item = await this.quizzes.itemBelongsToAttempt(
      attemptId,
      quizAttemptItemId,
    );
    if (item === undefined) {
      throw new NotFoundException('Quiz item not found on this attempt');
    }
    const optionOk = await this.quizzes.optionBelongsToQuestion(
      selectedOptionId,
      item.questionId,
    );
    if (optionOk === false) {
      throw new BadRequestException(
        'selectedOptionId does not belong to this question',
      );
    }
    const answered = await this.quizzes.answer(
      quizAttemptItemId,
      selectedOptionId,
    );
    if (answered === undefined) {
      throw new NotFoundException('Quiz item or option not found');
    }
    return this.requireAttempt(attemptId);
  }

  async complete(actor: AuthUser, attemptId: string) {
    requirePermission(actor, ['quiz.attempt']);
    const attempt = await this.requireAttempt(attemptId);
    if (attempt.userId !== actor.id) {
      throw new ForbiddenException('Can only complete your own attempt');
    }
    if (attempt.status !== 'in_progress') {
      throw new ConflictException('Attempt is not in progress');
    }
    await this.quizzes.complete(attemptId, actor.id, attempt.courseId);
    return this.requireAttempt(attemptId);
  }

  private requireRead(actor: AuthUser, attempt: PublicAttempt) {
    const isOwn = attempt.userId === actor.id;
    if (isOwn && hasPermission(actor, ['quiz.read.self'])) {
      return;
    }
    if (
      hasPermission(actor, ['quiz.read.org']) &&
      attempt.organizationId === actor.organizationId
    ) {
      return;
    }
    throw new ForbiddenException(
      'Missing permission: quiz.read.self or quiz.read.org',
    );
  }

  private async requireAttempt(attemptId: string): Promise<PublicAttempt> {
    const attempt = await this.quizzes.findById(attemptId);
    if (attempt === undefined) {
      throw new NotFoundException('Quiz attempt not found');
    }
    return attempt;
  }
}
