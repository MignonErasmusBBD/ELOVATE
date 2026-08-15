import { Injectable } from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import {
  isUuid,
  SqlParameter,
  textFromDatabase,
  whereClause,
} from '../helpers/values';
import { PostgresService } from '../services/postgres.service';

type UserRow = {
  id: string;
  organization_id: string;
  email: string;
  full_name: string | null;
  status: string;
  created_at: Date;
  roles: string[];
};

type AuthUserRow = {
  id: string;
  organization_id: string | null;
  organization_name: string | null;
  email: string;
  full_name: string | null;
  status: string;
};

export type PublicUser = {
  id: string;
  organizationId: string;
  email: string;
  fullName: string | undefined;
  status: string;
  roles: string[];
  createdAt: Date;
};

export type UserListFilters = {
  organizationId: string | undefined;
  role: string | undefined;
  search: string | undefined;
  status: string | undefined;
};

const userSelectSql = `SELECT
  u.id,
  u.organization_id,
  u.email,
  u.full_name,
  us.status_code AS status,
  u.created_at,
  coalesce(
    array_agg(r.role_name ORDER BY r.role_id) FILTER (WHERE r.role_id IS NOT NULL),
    '{}'
  ) AS roles
FROM users u
JOIN user_statuses us ON us.user_status_id = u.user_status_id
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN roles r ON r.role_id = ur.role_id`;

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    organizationId: row.organization_id,
    email: row.email,
    fullName: textFromDatabase(row.full_name),
    status: row.status,
    roles: row.roles,
    createdAt: row.created_at,
  };
}

@Injectable()
export class UsersRepository {
  constructor(private readonly postgres: PostgresService) {}

  async findById(userId: string): Promise<PublicUser | undefined> {
    if (isUuid(userId) === false) {
      return undefined;
    }
    const result = await this.postgres.query<UserRow>(
      `${userSelectSql} WHERE u.id = $1 GROUP BY u.id, us.status_code`,
      [userId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicUser(row);
  }

  async findOrganizationId(userId: string): Promise<string | undefined> {
    if (isUuid(userId) === false) {
      return undefined;
    }
    const result = await this.postgres.query<{ organization_id: string }>(
      'SELECT organization_id FROM users WHERE id = $1',
      [userId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return row.organization_id;
  }

  async list(filters: UserListFilters): Promise<PublicUser[]> {
    const values: SqlParameter[] = [];
    const conditions: string[] = [];
    if (filters.organizationId !== undefined) {
      values.push(filters.organizationId);
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
    return result.rows.map(toPublicUser);
  }

  async updateFullName(userId: string, fullName: string) {
    await this.postgres.query('UPDATE users SET full_name = $1 WHERE id = $2', [
      fullName,
      userId,
    ]);
  }

  async setStatus(userId: string, statusCode: 'active' | 'deactivated') {
    await this.postgres.query(
      `UPDATE users
       SET user_status_id = us.user_status_id
       FROM user_statuses us
       WHERE users.id = $1 AND us.status_code = $2`,
      [userId, statusCode],
    );
  }

  async loadAuthById(userId: string): Promise<AuthUser | undefined> {
    const result = await this.postgres.query<AuthUserRow>(
      `SELECT u.id, u.organization_id, o.name AS organization_name,
              u.email, u.full_name, us.status_code AS status
       FROM users u
       JOIN user_statuses us ON us.user_status_id = u.user_status_id
       LEFT JOIN organizations o ON o.id = u.organization_id
       LEFT JOIN organization_statuses os
         ON os.organization_status_id = o.organization_status_id
       WHERE u.id = $1
         AND us.status_code = 'active'
         AND (u.organization_id IS NULL OR os.status_code = 'active')`,
      [userId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    const roles = await this.postgres.query<{ role_name: string }>(
      `SELECT r.role_name
       FROM user_roles ur
       JOIN roles r ON r.role_id = ur.role_id
       WHERE ur.user_id = $1
       ORDER BY r.role_id`,
      [row.id],
    );
    const permissions = await this.postgres.query<{ permission_code: string }>(
      `SELECT DISTINCT p.permission_code
       FROM user_roles ur
       JOIN role_permissions rp ON rp.role_id = ur.role_id
       JOIN permissions p ON p.permission_id = rp.permission_id
       WHERE ur.user_id = $1
       ORDER BY p.permission_code`,
      [row.id],
    );
    return {
      id: row.id,
      organizationId: textFromDatabase(row.organization_id),
      organizationName: textFromDatabase(row.organization_name),
      email: row.email,
      fullName: textFromDatabase(row.full_name),
      status: row.status,
      roleNames: roles.rows.map((roleRow) => roleRow.role_name),
      permissionCodes: permissions.rows.map(
        (permissionRow) => permissionRow.permission_code,
      ),
    };
  }
}
