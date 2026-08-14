import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import {
  PermissionRow,
  PublicRole,
  RoleRow,
  roleSelectSql,
  toPublicPermission,
  toPublicRole,
} from '../helpers/rbac-records';
import { hasPermission, requirePermission } from '../helpers/require-permission';
import { isUuid, SqlParameter, whereClause } from '../helpers/values';
import { writeCatalogue, CatalogueInput } from './rbac-catalogue';
import { PostgresService } from './postgres.service';

type AssignmentRow = {
  user_id: string;
  email: string;
  organization_id: string;
  role_name: string;
  granted_at: Date;
};

@Injectable()
export class RbacService {
  constructor(private readonly postgres: PostgresService) {}

  async listRoles(
    actor: AuthUser,
    filters: { name: string | undefined },
  ) {
    requirePermission(actor, ['role.read']);
    const values: SqlParameter[] = [];
    const conditions: string[] = [];
    if (filters.name !== undefined) {
      values.push(filters.name);
      conditions.push(`r.role_name = $${values.length}`);
    }
    const result = await this.postgres.query<RoleRow>(
      `${roleSelectSql} ${whereClause(conditions)} ORDER BY r.role_id`,
      values,
    );
    return { items: result.rows.map(toPublicRole) };
  }

  async getRole(actor: AuthUser, roleName: string) {
    requirePermission(actor, ['role.read']);
    const role = await this.findRole(roleName);
    const permissions = await this.postgres.query<PermissionRow>(
      `SELECT p.permission_id, p.permission_code, p.permission_description
       FROM role_permissions rp
       JOIN permissions p ON p.permission_id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.permission_code`,
      [role.roleId],
    );
    return {
      ...role,
      permissions: permissions.rows.map(toPublicPermission),
    };
  }

  async listPermissions(actor: AuthUser, search: string | undefined) {
    requirePermission(actor, ['role.read']);
    const values: SqlParameter[] = [];
    const conditions: string[] = [];
    if (search !== undefined) {
      values.push(`%${search}%`);
      conditions.push(
        `(p.permission_code ILIKE $${values.length} OR coalesce(p.permission_description, '') ILIKE $${values.length})`,
      );
    }
    const result = await this.postgres.query<PermissionRow>(
      `SELECT p.permission_id, p.permission_code, p.permission_description
       FROM permissions p
       ${whereClause(conditions)}
       ORDER BY p.permission_code`,
      values,
    );
    return { items: result.rows.map(toPublicPermission) };
  }

  async listAssignments(
    actor: AuthUser,
    filters: {
      userId: string | undefined;
      organizationId: string | undefined;
      role: string | undefined;
    },
  ) {
    requirePermission(actor, ['role.read']);
    const values: SqlParameter[] = [];
    const conditions: string[] = [];

    if (hasPermission(actor, ['user.read.all']) === false) {
      if (
        filters.organizationId !== undefined &&
        filters.organizationId !== actor.organizationId
      ) {
        throw new ForbiddenException(
          'Can only list role grants in your own organisation',
        );
      }
      values.push(actor.organizationId);
      conditions.push(`u.organization_id = $${values.length}`);
    } else if (filters.organizationId !== undefined) {
      values.push(filters.organizationId);
      conditions.push(`u.organization_id = $${values.length}`);
    }

    if (filters.userId !== undefined) {
      if (isUuid(filters.userId) === false) {
        return { items: [] };
      }
      values.push(filters.userId);
      conditions.push(`ur.user_id = $${values.length}`);
    }
    if (filters.role !== undefined) {
      values.push(filters.role);
      conditions.push(`r.role_name = $${values.length}`);
    }

    const result = await this.postgres.query<AssignmentRow>(
      `SELECT ur.user_id, u.email, u.organization_id, r.role_name, ur.granted_at
       FROM user_roles ur
       JOIN users u ON u.id = ur.user_id
       JOIN roles r ON r.role_id = ur.role_id
       ${whereClause(conditions)}
       ORDER BY ur.granted_at DESC`,
      values,
    );
    return {
      items: result.rows.map((row) => ({
        userId: row.user_id,
        email: row.email,
        organizationId: row.organization_id,
        roleName: row.role_name,
        grantedAt: row.granted_at,
      })),
    };
  }

  async assign(actor: AuthUser, userId: string, roleName: string) {
    requirePermission(actor, ['role.assign']);
    if (roleName === 'learner') {
      throw new BadRequestException(
        'learner is granted at signup; use this endpoint for extra roles only',
      );
    }
    await this.prepareGrantChange(actor, userId, roleName);
    const inserted = await this.postgres.query<{ user_id: string }>(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, r.role_id FROM roles r WHERE r.role_name = $2
       ON CONFLICT DO NOTHING
       RETURNING user_id`,
      [userId, roleName],
    );
    if (inserted.rows[0] === undefined) {
      throw new ConflictException('User already has that role');
    }
    return { userId, roleName };
  }

  async unassign(actor: AuthUser, userId: string, roleName: string) {
    requirePermission(actor, ['role.remove']);
    if (roleName === 'learner') {
      throw new BadRequestException('Never unassign learner');
    }
    await this.prepareGrantChange(actor, userId, roleName);
    const deleted = await this.postgres.query<{ user_id: string }>(
      `DELETE FROM user_roles ur
       USING roles r
       WHERE ur.role_id = r.role_id
         AND ur.user_id = $1
         AND r.role_name = $2
       RETURNING ur.user_id`,
      [userId, roleName],
    );
    if (deleted.rows[0] === undefined) {
      throw new NotFoundException('Role grant not found');
    }
    return { userId, roleName, removed: true };
  }

  async catalogue(actor: AuthUser, input: CatalogueInput) {
    requirePermission(actor, ['role.catalogue.write']);
    return writeCatalogue(this.postgres, input);
  }

  private async prepareGrantChange(
    actor: AuthUser,
    userId: string,
    roleName: string,
  ): Promise<PublicRole> {
    const role = await this.findRole(roleName);
    if (isUuid(userId) === false) {
      throw new NotFoundException('User not found');
    }
    const result = await this.postgres.query<{
      id: string;
      organization_id: string;
    }>('SELECT id, organization_id FROM users WHERE id = $1', [userId]);
    const user = result.rows[0];
    if (user === undefined) {
      throw new NotFoundException('User not found');
    }
    if (
      hasPermission(actor, ['user.read.all']) === false &&
      user.organization_id !== actor.organizationId
    ) {
      throw new ForbiddenException(
        'Can only change role grants for users in your own organisation',
      );
    }
    return role;
  }

  private async findRole(roleName: string): Promise<PublicRole> {
    const result = await this.postgres.query<RoleRow>(
      `${roleSelectSql} WHERE r.role_name = $1`,
      [roleName],
    );
    const row = result.rows[0];
    if (row === undefined) {
      throw new NotFoundException(`Role not found: ${roleName}`);
    }
    return toPublicRole(row);
  }
}
