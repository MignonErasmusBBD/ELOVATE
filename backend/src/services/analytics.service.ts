import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { requirePermission } from '../helpers/require-permission';
import { AnalyticsRepository } from '../repositories/analytics.repository';

@Injectable()
export class AnalyticsService {
  constructor(private readonly analytics: AnalyticsRepository) {}

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
