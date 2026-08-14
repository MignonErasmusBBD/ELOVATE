import { textFromDatabase } from './values';

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

export type PublicRole = {
  roleId: number;
  roleName: string;
  description: string | undefined;
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

export function toPublicPermission(row: PermissionRow) {
  return {
    permissionId: row.permission_id,
    code: row.permission_code,
    description: textFromDatabase(row.permission_description),
  };
}
