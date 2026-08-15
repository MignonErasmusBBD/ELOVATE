import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { hasPermission, requirePermission } from '../helpers/require-permission';
import { PublicUser, UsersRepository } from '../repositories/users.repository';

function ownProfile(actor: AuthUser, fullName?: string) {
  return {
    id: actor.id,
    organizationId: actor.organizationId,
    organizationName: actor.organizationName,
    email: actor.email,
    fullName: fullName === undefined ? actor.fullName : fullName,
    status: actor.status,
    roles: actor.roleNames,
    permissionCodes: actor.permissionCodes,
  };
}

@Injectable()
export class UsersService {
  constructor(private readonly users: UsersRepository) {}

  async readOwnProfile(actor: AuthUser) {
    requirePermission(actor, ['user.read.self']);
    return ownProfile(actor);
  }

  async updateOwnProfile(actor: AuthUser, fullName: string | undefined) {
    requirePermission(actor, ['user.update.self']);
    if (fullName === undefined) {
      return ownProfile(actor);
    }
    await this.users.updateFullName(actor.id, fullName);
    return ownProfile(actor, fullName);
  }

  async list(
    actor: AuthUser,
    filters: {
      organizationId: string | undefined;
      unassigned: boolean | undefined;
      role: string | undefined;
      search: string | undefined;
      status: string | undefined;
    },
  ) {
    const canReadAll = hasPermission(actor, ['user.read.all']);
    const canReadOrg = hasPermission(actor, ['user.read.org']);
    if (canReadAll === false && canReadOrg === false) {
      throw new ForbiddenException(
        'Missing permission: user.read.org or user.read.all',
      );
    }

    if (filters.unassigned) {
      const canListUnassigned =
        hasPermission(actor, ['user.update.org']) ||
        hasPermission(actor, ['user.read.all']);
      if (canListUnassigned === false) {
        throw new ForbiddenException(
          'Missing permission: user.update.org or user.read.all',
        );
      }
      const items = await this.users.list({
        organizationId: undefined,
        unassigned: true,
        role: filters.role,
        search: filters.search,
        status: filters.status,
      });
      return { items };
    }

    let organizationId = filters.organizationId;
    if (canReadAll === false) {
      if (actor.organizationId === undefined) {
        return { items: [] };
      }
      if (
        organizationId !== undefined &&
        organizationId !== actor.organizationId
      ) {
        throw new ForbiddenException(
          'Can only list users in your own organisation',
        );
      }
      organizationId = actor.organizationId;
    }

    const items = await this.users.list({
      organizationId,
      unassigned: undefined,
      role: filters.role,
      search: filters.search,
      status: filters.status,
    });
    return { items };
  }

  async getOne(actor: AuthUser, userId: string) {
    const user = await this.requireUser(userId);
    const isSelf = user.id === actor.id;
    const sameOrg = user.organizationId === actor.organizationId;
    const canRead =
      (isSelf && hasPermission(actor, ['user.read.self'])) ||
      (sameOrg && hasPermission(actor, ['user.read.org'])) ||
      hasPermission(actor, ['user.read.all']);
    if (canRead === false) {
      throw new ForbiddenException(
        'Missing permission: user.read.self, user.read.org, or user.read.all',
      );
    }
    return user;
  }

  async update(actor: AuthUser, userId: string, fullName: string | undefined) {
    requirePermission(actor, ['user.update.org']);
    const user = await this.requireUser(userId);
    if (user.organizationId !== actor.organizationId) {
      throw new ForbiddenException(
        'Can only update users in your own organisation',
      );
    }
    if (fullName === undefined) {
      return user;
    }
    await this.users.updateFullName(userId, fullName);
    return this.requireUser(userId);
  }

  async placeInOwnOrganisation(actor: AuthUser, userId: string) {
    requirePermission(actor, ['user.update.org']);
    if (actor.organizationId === undefined) {
      throw new ForbiddenException(
        'You need an organisation to add people',
      );
    }
    const user = await this.requireUser(userId);
    if (user.organizationId === actor.organizationId) {
      return user;
    }
    if (user.organizationId !== undefined) {
      throw new BadRequestException(
        'User already belongs to an organisation',
      );
    }
    if (user.status !== 'active') {
      throw new ForbiddenException('Cannot add a deactivated user');
    }
    await this.users.setOrganizationId(userId, actor.organizationId);
    return this.requireUser(userId);
  }

  async setStatus(
    actor: AuthUser,
    userId: string,
    statusCode: 'active' | 'deactivated',
  ) {
    requirePermission(actor, ['user.deactivate']);
    const user = await this.requireUser(userId);
    if (user.organizationId !== actor.organizationId) {
      throw new ForbiddenException(
        'Can only change status for users in your own organisation',
      );
    }
    if (user.id === actor.id) {
      throw new ForbiddenException('You cannot deactivate yourself');
    }
    await this.users.setStatus(userId, statusCode);
    return this.requireUser(userId);
  }

  private async requireUser(userId: string): Promise<PublicUser> {
    const user = await this.users.findById(userId);
    if (user === undefined) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
