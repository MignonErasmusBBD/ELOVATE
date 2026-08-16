import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  canActivateCourse,
  MIN_ACTIVE_QUESTIONS_TO_ACTIVATE,
  MIN_COURSE_SECTIONS_TO_ACTIVATE,
} from '../helpers/course-readiness';
import { AuthUser } from '../helpers/auth-user';
import { hasPermission, requirePermission } from '../helpers/require-permission';
import { ContentViewSessionsRepository } from '../repositories/content-view-sessions.repository';
import {
  CoursesContentRepository,
  PublicSection,
  PublicTopic,
} from '../repositories/courses-content.repository';
import {
  CourseAccess,
  CoursesRepository,
  PublicCourse,
} from '../repositories/courses.repository';
import { EnrollmentsRepository } from '../repositories/enrollments.repository';

@Injectable()
export class CoursesService {
  constructor(
    private readonly courses: CoursesRepository,
    private readonly content: CoursesContentRepository,
    private readonly enrollments: EnrollmentsRepository,
    private readonly contentViewSessions: ContentViewSessionsRepository,
  ) {}

  async listCommunity(actor: AuthUser, search: string | undefined) {
    requirePermission(actor, ['course.community.read']);
    const items = await this.courses.list(
      {
        organizationId: undefined,
        visibility: 'community',
        search,
        status: 'active',
      },
      {
        includeCommunity: true,
        privateOrganizationId: undefined,
        enrolledUserId: undefined,
      },
    );
    return { items };
  }

  async list(
    actor: AuthUser,
    filters: {
      organizationId: string | undefined;
      visibility: string | undefined;
      search: string | undefined;
      status: string | undefined;
    },
  ) {
    const canReadCommunity = hasPermission(actor, ['course.community.read']);
    const canReadPrivate = hasPermission(actor, ['course.private.read']);
    if (canReadCommunity === false && canReadPrivate === false) {
      throw new ForbiddenException(
        'Missing permission: course.community.read or course.private.read',
      );
    }
    await this.enrollments.applyDueDateOutcomes({ userId: actor.id });
    if (filters.status === 'draft' && this.canSeeNonActive(actor) === false) {
      return { items: [] };
    }
    if (
      filters.status === 'deactivated' &&
      this.canSeeNonActive(actor) === false
    ) {
      // Learners can still see their own enrolled deactivated courses
      const enrolledAccess: CourseAccess = {
        includeCommunity: false,
        privateOrganizationId: undefined,
        enrolledUserId: actor.id,
      };
      const items = await this.courses.list(filters, enrolledAccess);
      return { items };
    }
    if (
      filters.status === 'all' &&
      this.canSeeNonActive(actor) === false
    ) {
      const items = await this.courses.list(
        { ...filters, learnerCatalogue: true },
        this.accessFor(actor),
      );
      return { items };
    }
    const items = await this.courses.list(filters, this.accessFor(actor));
    return { items };
  }

  async getOne(actor: AuthUser, courseId: string) {
    return this.requireVisibleCourse(actor, courseId);
  }

  async create(
    actor: AuthUser,
    input: {
      title: string;
      description: string | undefined;
      visibility: 'private' | 'community';
      organizationId: string | undefined;
    },
  ) {
    if (input.visibility === 'community') {
      requirePermission(actor, ['course.community.create']);
    } else {
      requirePermission(actor, ['course.private.create']);
      if (actor.organizationId === undefined) {
        throw new ForbiddenException('You are not assigned to an organisation');
      }
    }
    if (
      input.visibility === 'private' &&
      input.organizationId !== undefined &&
      input.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException(
        'Courses are created in your own organisation',
      );
    }
    const courseId = await this.courses.insert({
      organizationId:
        input.visibility === 'community' ? undefined : actor.organizationId,
      title: input.title,
      description: input.description,
      visibility: input.visibility,
      createdBy: actor.id,
    });
    if (courseId === undefined) {
      throw new NotFoundException('Course visibility not found');
    }
    return this.requireCourse(courseId);
  }

  async update(
    actor: AuthUser,
    courseId: string,
    input: { title: string | undefined; description: string | undefined; quizQuestionCount: number | undefined },
  ) {
    const course = await this.requireCourse(courseId);
    this.requireUpdate(actor, course);
    if (input.title !== undefined) {
      await this.courses.updateTitle(courseId, input.title);
    }
    if (input.description !== undefined) {
      await this.courses.updateDescription(courseId, input.description);
    }
    if (input.quizQuestionCount !== undefined) {
      const clamped = Math.min(Math.max(Math.round(input.quizQuestionCount), 1), 20);
      await this.courses.updateQuizQuestionCount(courseId, clamped);
    }
    return this.requireCourse(courseId);
  }

  async publish(actor: AuthUser, courseId: string) {
    requirePermission(actor, ['course.community.publish']);
    const course = await this.requireCourse(courseId);
    if (
      course.visibility === 'private' &&
      course.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException(
        'Can only publish private courses from your own organisation',
      );
    }
    await this.courses.setVisibility(courseId, 'community');
    return this.requireCourse(courseId);
  }

  async unpublish(actor: AuthUser, courseId: string) {
    const course = await this.requireCourse(courseId);
    if (course.visibility === 'community') {
      requirePermission(actor, ['course.community.update']);
    } else {
      this.requireUpdate(actor, course);
    }
    await this.courses.setVisibility(courseId, 'private');
    return this.requireCourse(courseId);
  }

  async setStatus(
    actor: AuthUser,
    courseId: string,
    statusCode: 'active' | 'deactivated' | 'draft',
  ) {
    const course = await this.requireCourse(courseId);
    if (statusCode === 'deactivated') {
      this.requireDeactivate(actor, course);
    } else {
      this.requireUpdate(actor, course);
    }
    if (statusCode === 'active') {
      if (
        canActivateCourse({
          sectionCount: course.sectionCount,
          activeQuestionCount: course.activeQuestionCount,
        }) === false
      ) {
        throw new BadRequestException(
          `A course needs at least ${MIN_COURSE_SECTIONS_TO_ACTIVATE} section and ${MIN_ACTIVE_QUESTIONS_TO_ACTIVATE} active questions before it can be activated.`,
        );
      }
    }
    await this.courses.setStatus(courseId, statusCode);
    return this.requireCourse(courseId);
  }

  async listSections(actor: AuthUser, courseId: string) {
    await this.requireVisibleCourse(actor, courseId);
    const items = await this.content.listSections(courseId);
    return { items };
  }

  async getSection(actor: AuthUser, courseId: string, sectionId: string) {
    await this.requireVisibleCourse(actor, courseId);
    return this.requireSection(courseId, sectionId);
  }

  async addSection(
    actor: AuthUser,
    courseId: string,
    title: string,
    position: number,
    contentBlocks:
      | {
          contentType: 'text' | 'code';
          bodyText: string;
          position: number;
        }[]
      | undefined,
  ) {
    const course = await this.requireCourse(courseId);
    this.requireSectionWrite(actor, course);
    const section = await this.content.insertSection(
      courseId,
      title,
      position,
      contentBlocks === undefined ? [] : contentBlocks,
    );
    await this.courses.touch(courseId);
    return section;
  }

  async updateSection(
    actor: AuthUser,
    courseId: string,
    sectionId: string,
    title: string,
    position: number,
  ) {
    const course = await this.requireCourse(courseId);
    this.requireSectionWrite(actor, course);
    await this.requireSection(courseId, sectionId);
    await this.content.updateSection(courseId, sectionId, title, position);
    await this.courses.touch(courseId);
    return this.requireSection(courseId, sectionId);
  }

  async replaceSection(
    actor: AuthUser,
    courseId: string,
    sectionId: string,
    title: string,
    position: number,
    contentBlocks: {
      contentType: 'text' | 'code';
      bodyText: string;
      position: number;
    }[],
  ) {
    const course = await this.requireCourse(courseId);
    this.requireSectionWrite(actor, course);
    await this.requireSection(courseId, sectionId);
    const section = await this.content.replaceSection(
      courseId,
      sectionId,
      title,
      position,
      contentBlocks,
    );
    if (section === undefined) {
      throw new NotFoundException('Section not found');
    }
    await this.courses.touch(courseId);
    return section;
  }

  async removeSection(actor: AuthUser, courseId: string, sectionId: string) {
    const course = await this.requireCourse(courseId);
    this.requireSectionWrite(actor, course);
    await this.requireSection(courseId, sectionId);
    const hasQuestions = await this.content.sectionHasQuestions(sectionId);
    if (hasQuestions) {
      throw new ConflictException(
        'Section still has questions; move or retire them first',
      );
    }
    await this.content.deleteSection(courseId, sectionId);
    await this.courses.touch(courseId);
    return { courseId, sectionId, removed: true };
  }

  async listTopics(actor: AuthUser, courseId: string) {
    await this.requireVisibleCourse(actor, courseId);
    const items = await this.content.listTopics(courseId);
    return { items };
  }

  async addTopic(actor: AuthUser, courseId: string, name: string) {
    const course = await this.requireCourse(courseId);
    this.requireSectionWrite(actor, course);
    const topic = await this.content.insertTopic(courseId, name);
    await this.courses.touch(courseId);
    return topic;
  }

  async updateTopic(
    actor: AuthUser,
    courseId: string,
    topicId: string,
    name: string,
  ) {
    const course = await this.requireCourse(courseId);
    this.requireSectionWrite(actor, course);
    const topic = await this.content.updateTopic(courseId, topicId, name);
    if (topic === undefined) {
      throw new NotFoundException('Topic not found');
    }
    await this.courses.touch(courseId);
    return topic;
  }

  async removeTopic(actor: AuthUser, courseId: string, topicId: string) {
    const course = await this.requireCourse(courseId);
    this.requireSectionWrite(actor, course);
    await this.requireTopic(courseId, topicId);
    const removed = await this.content.deleteTopic(courseId, topicId);
    if (removed === false) {
      throw new NotFoundException('Topic not found');
    }
    await this.courses.touch(courseId);
    return { courseId, topicId, removed: true };
  }

  async recordContentView(
    actor: AuthUser,
    courseId: string,
    sectionId: string,
    durationSeconds: number,
  ): Promise<void> {
    requirePermission(actor, ['quiz.attempt']);
    const enrolled = await this.enrollments.hasActiveEnrollment(actor.id, courseId);
    if (enrolled === false) {
      throw new ForbiddenException('An active enrollment is required');
    }
    await this.contentViewSessions.record({
      userId: actor.id,
      courseId,
      courseSectionId: sectionId,
      durationSeconds,
    });
  }

  private accessFor(actor: AuthUser): CourseAccess {
    return {
      includeCommunity: hasPermission(actor, ['course.community.read']),
      privateOrganizationId: hasPermission(actor, ['course.private.read'])
        ? actor.organizationId
        : undefined,
      enrolledUserId: actor.id,
    };
  }

  private canSeeNonActive(actor: AuthUser): boolean {
    return hasPermission(actor, [
      'course.community.update',
      'course.community.delete',
      'course.private.update',
      'course.private.delete',
    ]);
  }

  private requireUpdate(actor: AuthUser, course: PublicCourse) {
    if (course.visibility === 'community') {
      requirePermission(actor, ['course.community.update']);
      return;
    }
    requirePermission(actor, ['course.private.update']);
    if (course.organizationId !== actor.organizationId) {
      throw new ForbiddenException(
        'Can only update private courses in your own organisation',
      );
    }
  }

  private requireDeactivate(actor: AuthUser, course: PublicCourse) {
    if (course.visibility === 'community') {
      requirePermission(actor, ['course.community.delete']);
      return;
    }
    requirePermission(actor, ['course.private.delete']);
    if (course.organizationId !== actor.organizationId) {
      throw new ForbiddenException(
        'Can only deactivate private courses in your own organisation',
      );
    }
  }

  private requireSectionWrite(actor: AuthUser, course: PublicCourse) {
    requirePermission(actor, ['course.section.write']);
    this.requireUpdate(actor, course);
  }

  private async requireCourse(courseId: string): Promise<PublicCourse> {
    const course = await this.courses.findById(courseId);
    if (course === undefined) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  private async requireVisibleCourse(
    actor: AuthUser,
    courseId: string,
  ): Promise<PublicCourse> {
    await this.enrollments.applyDueDateOutcomes({
      userId: actor.id,
      courseId,
    });
    const course = await this.courses.findById(courseId, actor.id);
    if (course === undefined) {
      throw new NotFoundException('Course not found');
    }
    const canRead = await this.canRead(actor, course);
    if (canRead === false) {
      throw new ForbiddenException('Missing permission to read this course');
    }
    return course;
  }

  private async canRead(
    actor: AuthUser,
    course: PublicCourse,
  ): Promise<boolean> {
    if (
      course.visibility === 'community' &&
      hasPermission(actor, ['course.community.read'])
    ) {
      if (course.status === 'active') {
        return true;
      }
      return hasPermission(actor, [
        'course.community.update',
        'course.community.delete',
      ]);
    }
    if (
      course.visibility === 'private' &&
      course.organizationId === actor.organizationId &&
      hasPermission(actor, ['course.private.read'])
    ) {
      if (course.status === 'active') {
        return true;
      }
      return hasPermission(actor, [
        'course.private.update',
        'course.private.delete',
      ]);
    }
    if (course.status !== 'active') {
      return false;
    }
    return this.courses.isVisible(course.id, {
      includeCommunity: false,
      privateOrganizationId: undefined,
      enrolledUserId: actor.id,
    });
  }

  private async requireSection(
    courseId: string,
    sectionId: string,
  ): Promise<PublicSection> {
    const section = await this.content.findSection(courseId, sectionId);
    if (section === undefined) {
      throw new NotFoundException('Section not found');
    }
    return section;
  }

  private async requireTopic(
    courseId: string,
    topicId: string,
  ): Promise<PublicTopic> {
    const topic = await this.content.findTopic(courseId, topicId);
    if (topic === undefined) {
      throw new NotFoundException('Topic not found');
    }
    return topic;
  }
}
