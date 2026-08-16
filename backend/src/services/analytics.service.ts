import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { hasPermission, requirePermission } from '../helpers/require-permission';
import { AnalyticsRepository } from '../repositories/analytics.repository';
import { CoursesRepository } from '../repositories/courses.repository';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly analytics: AnalyticsRepository,
    private readonly courses: CoursesRepository,
  ) {}

  async readOwnOverview(actor: AuthUser) {
    requirePermission(actor, ['analytics.read.self']);
    return this.analytics.overallProfile(actor.id);
  }

  async readOwnCourseMastery(actor: AuthUser, courseId: string) {
    requirePermission(actor, ['analytics.read.self']);
    return this.analytics.courseMastery(actor.id, courseId);
  }

  async readOrganizationOverview(
    actor: AuthUser,
    organizationId: string | undefined,
    courseId: string | undefined,
  ) {
    requirePermission(actor, ['analytics.read.org']);
    return this.analytics.orgOverview(
      this.requireOwnOrganization(actor, organizationId),
      courseId,
    );
  }

  async readOrganizationAttempts(
    actor: AuthUser,
    organizationId: string | undefined,
    courseId: string | undefined,
    userId: string | undefined,
  ) {
    requirePermission(actor, ['analytics.read.attempts']);
    return this.analytics.orgAttempts(
      this.requireOwnOrganization(actor, organizationId),
      courseId,
      userId,
    );
  }

  async readOrganizationMastery(
    actor: AuthUser,
    organizationId: string | undefined,
    courseId: string | undefined,
    userId: string | undefined,
  ) {
    requirePermission(actor, ['analytics.read.mastery']);
    return this.analytics.orgMastery(
      this.requireOwnOrganization(actor, organizationId),
      courseId,
      userId,
    );
  }

  async readEducatorCourseOverview(actor: AuthUser, courseId: string) {
    requirePermission(actor, ['analytics.read.org']);
    const course = await this.courses.findById(courseId);
    if (course === undefined) {
      throw new NotFoundException('Course not found');
    }
    this.requireCourseOverviewAccess(actor, course);
    const overview = await this.analytics.educatorCourseOverview(courseId);
    return {
      ...overview,
      courseTitle: course.title,
    };
  }

  async readEducatorCoursePracticeInsights(actor: AuthUser, courseId: string) {
    requirePermission(actor, ['analytics.read.org']);
    const course = await this.courses.findById(courseId);
    if (course === undefined) {
      throw new NotFoundException('Course not found');
    }
    this.requireCourseOverviewAccess(actor, course);
    const insights =
      await this.analytics.educatorCoursePracticeInsights(courseId);
    return {
      ...insights,
      courseId,
      courseTitle: course.title,
    };
  }

  private requireCourseOverviewAccess(
    actor: AuthUser,
    course: {
      visibility: string;
      organizationId: string | undefined;
    },
  ) {
    if (course.visibility === 'community') {
      if (
        hasPermission(actor, [
          'course.community.update',
          'course.community.read',
        ]) === false
      ) {
        throw new ForbiddenException(
          'Missing permission to view community course analytics',
        );
      }
      return;
    }

    if (hasPermission(actor, ['course.private.read']) === false) {
      throw new ForbiddenException(
        'Missing permission to view private course analytics',
      );
    }
    if (
      course.organizationId !== undefined &&
      actor.organizationId !== undefined &&
      course.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException(
        'Can only view analytics for private courses in your organisation',
      );
    }
    if (actor.organizationId === undefined) {
      throw new ForbiddenException(
        'You need an organisation to view private course analytics',
      );
    }
  }

  private requireOwnOrganization(
    actor: AuthUser,
    organizationId: string | undefined,
  ): string {
    if (actor.organizationId === undefined) {
      throw new ForbiddenException('You are not assigned to an organisation');
    }
    if (
      organizationId !== undefined &&
      organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException(
        'Can only read analytics for your own organisation',
      );
    }
    return actor.organizationId;
  }
}
