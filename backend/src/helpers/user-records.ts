import { NotFoundException } from '@nestjs/common';
import { AuthUser } from './auth-user';
import { isUuid, SqlQuery, textFromDatabase } from './values';

export type PublicUser = {
  id: string;
  organizationId: string;
  email: string;
  fullName: string | undefined;
  status: string;
  roles: string[];
  createdAt: Date;
};

export type UserRow = {
  id: string;
  organization_id: string;
  email: string;
  full_name: string | null;
  status: string;
  created_at: Date;
  roles: string[];
};

export const userSelectSql = `SELECT
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

export function ownProfile(actor: AuthUser, fullName?: string) {
  return {
    id: actor.id,
    organizationId: actor.organizationId,
    email: actor.email,
    fullName: fullName === undefined ? actor.fullName : fullName,
    status: actor.status,
    roles: actor.roleNames,
    permissionCodes: actor.permissionCodes,
  };
}

export function toPublicUser(row: UserRow): PublicUser {
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

export async function loadUserById(
  runQuery: SqlQuery,
  userId: string,
): Promise<PublicUser> {
  if (isUuid(userId) === false) {
    throw new NotFoundException('User not found');
  }
  const result = await runQuery<UserRow>(
    `${userSelectSql} WHERE u.id = $1 GROUP BY u.id, us.status_code`,
    [userId],
  );
  const row = result.rows[0];
  if (row === undefined) {
    throw new NotFoundException('User not found');
  }
  return toPublicUser(row);
}
