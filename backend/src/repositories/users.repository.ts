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
  organization_id: string | null;
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
  role_names: string[] | null;
  permission_codes: string[] | null;
};

export type PublicUser = {
  id: string;
  organizationId: string | undefined;
  email: string;
  fullName: string | undefined;
  status: string;
  roles: string[];
  createdAt: Date;
};

export type UserListFilters = {
  organizationId: string | undefined;
  unassigned: boolean | undefined;
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
    (
      SELECT array_agg(r.role_name ORDER BY r.role_id)
      FROM user_roles ur
      JOIN roles r ON r.role_id = ur.role_id
      WHERE ur.user_id = u.id
    ),
    '{}'
  ) AS roles
FROM users u
JOIN user_statuses us ON us.user_status_id = u.user_status_id`;

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    organizationId: textFromDatabase(row.organization_id),
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
      `${userSelectSql} WHERE u.id = $1`,
      [userId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicUser(row);
  }

  async setOrganizationId(userId: string, organizationId: string) {
    await this.postgres.query(
      'UPDATE users SET organization_id = $1 WHERE id = $2',
      [organizationId, userId],
    );
  }

  async clearOrganizationId(userId: string) {
    await this.postgres.query(
      'UPDATE users SET organization_id = NULL WHERE id = $1',
      [userId],
    );
  }

  async list(filters: UserListFilters): Promise<PublicUser[]> {
    const values: SqlParameter[] = [];
    const conditions: string[] = [];
    if (filters.unassigned) {
      conditions.push('u.organization_id IS NULL');
    } else if (filters.organizationId !== undefined) {
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
              u.email, u.full_name, us.status_code AS status,
              coalesce((
                SELECT array_agg(r.role_name ORDER BY r.role_id)
                FROM user_roles ur
                JOIN roles r ON r.role_id = ur.role_id
                WHERE ur.user_id = u.id
              ), ARRAY[]::text[]) AS role_names,
              coalesce((
                SELECT array_agg(DISTINCT p.permission_code ORDER BY p.permission_code)
                FROM user_roles ur
                JOIN role_permissions rp ON rp.role_id = ur.role_id
                JOIN permissions p ON p.permission_id = rp.permission_id
                WHERE ur.user_id = u.id
              ), ARRAY[]::text[]) AS permission_codes
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
    return {
      id: row.id,
      organizationId: textFromDatabase(row.organization_id),
      organizationName: textFromDatabase(row.organization_name),
      email: row.email,
      fullName: textFromDatabase(row.full_name),
      status: row.status,
      roleNames: row.role_names ?? [],
      permissionCodes: row.permission_codes ?? [],
    };
  }
}
