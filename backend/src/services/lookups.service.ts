import { Injectable } from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { requirePermission } from '../helpers/require-permission';
import { LookupsRepository } from '../repositories/lookups.repository';

@Injectable()
export class LookupsService {
  constructor(private readonly lookups: LookupsRepository) {}

  async all(actor: AuthUser) {
    requirePermission(actor, ['user.read.self']);
    const [
      oauthProviders,
      courseVisibilities,
      questionFormats,
      enrollmentStatuses,
      quizAttemptStatuses,
      bloomLevels,
      difficultyLevels,
      interventionTriggerTypes,
      interventionFlagStatuses,
      userStatuses,
      organizationStatuses,
      courseStatuses,
      questionStatuses,
      roles,
    ] = await Promise.all([
      this.lookups.oauthProviders(),
      this.lookups.courseVisibilities(),
      this.lookups.questionFormats(),
      this.lookups.enrollmentStatuses(),
      this.lookups.quizAttemptStatuses(),
      this.lookups.bloomLevels(),
      this.lookups.difficultyLevels(),
      this.lookups.interventionTriggerTypes(),
      this.lookups.interventionFlagStatuses(),
      this.lookups.userStatuses(),
      this.lookups.organizationStatuses(),
      this.lookups.courseStatuses(),
      this.lookups.questionStatuses(),
      this.lookups.roles(),
    ]);
    return {
      oauthProviders,
      courseVisibilities,
      questionFormats,
      enrollmentStatuses,
      quizAttemptStatuses,
      bloomLevels,
      difficultyLevels,
      interventionTriggerTypes,
      interventionFlagStatuses,
      userStatuses,
      organizationStatuses,
      courseStatuses,
      questionStatuses,
      roles,
    };
  }

  async bloomLevels(actor: AuthUser) {
    requirePermission(actor, ['user.read.self']);
    return { items: await this.lookups.bloomLevels() };
  }

  async difficultyLevels(actor: AuthUser) {
    requirePermission(actor, ['user.read.self']);
    return { items: await this.lookups.difficultyLevels() };
  }

  async questionFormats(actor: AuthUser) {
    requirePermission(actor, ['user.read.self']);
    return { items: await this.lookups.questionFormats() };
  }

  async courseVisibilities(actor: AuthUser) {
    requirePermission(actor, ['user.read.self']);
    return { items: await this.lookups.courseVisibilities() };
  }
}
