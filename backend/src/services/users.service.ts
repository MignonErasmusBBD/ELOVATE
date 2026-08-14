import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { hasPermission, requirePermission } from '../helpers/require-permission';
import {
  loadUserById,
  ownProfile,
  toPublicUser,
  userSelectSql,
  UserRow,
} from '../helpers/user-records';
import { SqlParameter, whereClause } from '../helpers/values';
import { PostgresService } from './postgres.service';

@Injectable()
export class UsersService {
  constructor(private readonly postgres: PostgresService) {}

  async readOwnProfile(actor: AuthUser) {
    requirePermission(actor, ['user.read.self']);
    return ownProfile(actor);
  }

  async updateOwnProfile(actor: AuthUser, fullName: string | undefined) {
    requirePermission(actor, ['user.update.self']);
    if (fullName === undefined) {
      return ownProfile(actor);
    }
    await this.postgres.query(
      'UPDATE users SET full_name = $1 WHERE id = $2',
      [fullName, actor.id],
    );
    return ownProfile(actor, fullName);
  }

  async list(
    actor: AuthUser,
    filters: {
      organizationId: string | undefined;
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

    let organizationId = filters.organizationId;
    if (canReadAll === false) {
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

    const values: SqlParameter[] = [];
    const conditions: string[] = [];

    if (organizationId !== undefined) {
      values.push(organizationId);
      conditions.push(`u.organization_id = $${values.length}`);
    }
    if (filters.status !== undefined) {
      values.push(filters.status);
      conditions.push(`us.status_code = $${values.length}`);
    }
    if (filters.search !== undefined) {
      values.push(`%${filters.search}%`);
      conditions.push(
        `(u.email ILIKE $${values.length} OR coalesce(u.full_name, '') ILIKE $${values.length})`,
      );
    }
    if (filters.role !== undefined) {
      values.push(filters.role);
      conditions.push(`EXISTS (
        SELECT 1 FROM user_roles urf
        JOIN roles rf ON rf.role_id = urf.role_id
        WHERE urf.user_id = u.id AND rf.role_name = $${values.length}
      )`);
    }

    const result = await this.postgres.query<UserRow>(
      `${userSelectSql}
       ${whereClause(conditions)}
       GROUP BY u.id, us.status_code
       ORDER BY u.created_at DESC`,
      values,
    );

    return { items: result.rows.map(toPublicUser) };
  }

  async getOne(actor: AuthUser, userId: string) {
    const user = await loadUserById(
      (text, values) => this.postgres.query(text, values),
      userId,
    );
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
    const user = await this.findById(userId);
    if (user.organizationId !== actor.organizationId) {
      throw new ForbiddenException(
        'Can only update users in your own organisation',
      );
    }
    if (fullName === undefined) {
      return user;
    }
    await this.postgres.query('UPDATE users SET full_name = $1 WHERE id = $2', [
      fullName,
      userId,
    ]);
    return this.findById(userId);
  }

  async setStatus(
    actor: AuthUser,
    userId: string,
    statusCode: 'active' | 'deactivated',
  ) {
    requirePermission(actor, ['user.deactivate']);
    const user = await this.findById(userId);
    if (user.organizationId !== actor.organizationId) {
      throw new ForbiddenException(
        'Can only change status for users in your own organisation',
      );
    }
    if (user.id === actor.id) {
      throw new ForbiddenException('You cannot deactivate yourself');
    }
    await this.postgres.query(
      `UPDATE users
       SET user_status_id = us.user_status_id
       FROM user_statuses us
       WHERE users.id = $1 AND us.status_code = $2`,
      [userId, statusCode],
    );
    return this.findById(userId);
  }

  private findById(userId: string) {
    return loadUserById(
      (text, values) => this.postgres.query(text, values),
      userId,
    );
  }
}
