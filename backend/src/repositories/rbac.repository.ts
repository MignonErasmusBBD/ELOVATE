import { Injectable } from '@nestjs/common';
import {
  SqlParameter,
  textFromDatabase,
  whereClause,
} from '../helpers/values';
import { PostgresService } from '../services/postgres.service';

export type RoleRow = {
  role_id: number;
  role_name: string;
  role_description: string | null;
};

export type PermissionRow = {
  permission_id: number;
  permission_code: string;
  permission_description: string | null;
};

type AssignmentRow = {
  user_id: string;
  email: string;
  organization_id: string | null;
  role_name: string;
  granted_at: Date;
};

export type PublicRole = {
  roleId: number;
  roleName: string;
  description: string | undefined;
};

export type PublicPermission = {
  permissionId: number;
  code: string;
  description: string | undefined;
};

export type PublicAssignment = {
  userId: string;
  email: string;
  organizationId: string | undefined;
  roleName: string;
  grantedAt: Date;
};

export type AssignmentListFilters = {
  userId: string | undefined;
  organizationId: string | undefined;
  role: string | undefined;
};

export const roleSelectSql = `SELECT r.role_id, r.role_name, r.role_description
FROM roles r`;

export function toPublicRole(row: RoleRow): PublicRole {
  return {
    roleId: row.role_id,
    roleName: row.role_name,
    description: textFromDatabase(row.role_description),
  };
}

export function toPublicPermission(row: PermissionRow): PublicPermission {
  return {
    permissionId: row.permission_id,
    code: row.permission_code,
    description: textFromDatabase(row.permission_description),
  };
}

@Injectable()
export class RbacRepository {
  constructor(private readonly postgres: PostgresService) {}

  async listRoles(name: string | undefined): Promise<PublicRole[]> {
    const values: SqlParameter[] = [];
    const conditions: string[] = [];
    if (name !== undefined) {
      values.push(name);
      conditions.push(`r.role_name = $${values.length}`);
    }
    const result = await this.postgres.query<RoleRow>(
      `${roleSelectSql} ${whereClause(conditions)} ORDER BY r.role_id`,
      values,
    );
    return result.rows.map(toPublicRole);
  }

  async findRoleByName(roleName: string): Promise<PublicRole | undefined> {
    const result = await this.postgres.query<RoleRow>(
      `${roleSelectSql} WHERE r.role_name = $1`,
      [roleName],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicRole(row);
  }

  async listPermissionsForRole(roleId: number): Promise<PublicPermission[]> {
    const result = await this.postgres.query<PermissionRow>(
      `SELECT p.permission_id, p.permission_code, p.permission_description
       FROM role_permissions rp
       JOIN permissions p ON p.permission_id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.permission_code`,
      [roleId],
    );
    return result.rows.map(toPublicPermission);
  }

  async listPermissions(search: string | undefined): Promise<PublicPermission[]> {
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
    return result.rows.map(toPublicPermission);
  }

  async listAssignments(
    filters: AssignmentListFilters,
  ): Promise<PublicAssignment[]> {
    const values: SqlParameter[] = [];
    const conditions: string[] = [];
    if (filters.organizationId !== undefined) {
      values.push(filters.organizationId);
      conditions.push(`u.organization_id = $${values.length}`);
    }
    if (filters.userId !== undefined) {
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
    return result.rows.map((row) => ({
      userId: row.user_id,
      email: row.email,
      organizationId: textFromDatabase(row.organization_id),
      roleName: row.role_name,
      grantedAt: row.granted_at,
    }));
  }

  async insertAssignment(userId: string, roleName: string): Promise<boolean> {
    const inserted = await this.postgres.query<{ user_id: string }>(
      `INSERT INTO user_roles (user_id, role_id)
       SELECT $1, r.role_id FROM roles r WHERE r.role_name = $2
       ON CONFLICT DO NOTHING
       RETURNING user_id`,
      [userId, roleName],
    );
    return inserted.rows[0] !== undefined;
  }

  async deleteAssignment(userId: string, roleName: string): Promise<boolean> {
    const deleted = await this.postgres.query<{ user_id: string }>(
      `DELETE FROM user_roles ur
       USING roles r
       WHERE ur.role_id = r.role_id
         AND ur.user_id = $1
         AND r.role_name = $2
       RETURNING ur.user_id`,
      [userId, roleName],
    );
    return deleted.rows[0] !== undefined;
  }
}
