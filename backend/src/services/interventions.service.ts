import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { requirePermission } from '../helpers/require-permission';
import {
  InterventionsRepository,
  PublicFlag,
} from '../repositories/interventions.repository';

@Injectable()
export class InterventionsService {
  constructor(private readonly flags: InterventionsRepository) {}

  async list(
    actor: AuthUser,
    filters: {
      organizationId: string | undefined;
      courseId: string | undefined;
      userId: string | undefined;
      status: string | undefined;
    },
  ) {
    requirePermission(actor, ['intervention.flag.read']);
    if (
      filters.organizationId !== undefined &&
      filters.organizationId !== actor.organizationId
    ) {
      throw new ForbiddenException(
        'Can only list flags in your own organisation',
      );
    }
    const items = await this.flags.list({
      organizationId: actor.organizationId,
      courseId: filters.courseId,
      userId: filters.userId,
      status: filters.status,
    });
    return { items };
  }

  async getOne(actor: AuthUser, flagId: string) {
    requirePermission(actor, ['intervention.flag.read']);
    const flag = await this.requireFlag(flagId);
    this.requireSameOrganization(actor, flag);
    return flag;
  }

  async resolve(actor: AuthUser, flagId: string) {
    requirePermission(actor, ['intervention.flag.resolve']);
    const flag = await this.requireFlag(flagId);
    this.requireSameOrganization(actor, flag);
    await this.flags.resolve(flagId, actor.id);
    return this.requireFlag(flagId);
  }

  private requireSameOrganization(actor: AuthUser, flag: PublicFlag) {
    if (flag.organizationId !== actor.organizationId) {
      throw new ForbiddenException(
        'Can only access flags in your own organisation',
      );
    }
  }

  private async requireFlag(flagId: string): Promise<PublicFlag> {
    const flag = await this.flags.findById(flagId);
    if (flag === undefined) {
      throw new NotFoundException('Intervention flag not found');
    }
    return flag;
  }
}
