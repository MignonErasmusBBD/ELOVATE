import { Injectable, NotFoundException } from '@nestjs/common';
import { SqlQuery } from '../helpers/values';
import { PostgresService } from '../services/postgres.service';
import {
  PermissionRow,
  PublicPermission,
  PublicRole,
  RoleRow,
  roleSelectSql,
  toPublicPermission,
  toPublicRole,
} from './rbac.repository';

export type CatalogueInput = {
  roleName: string | undefined;
  roleDescription: string | undefined;
  permissionCode: string | undefined;
  permissionDescription: string | undefined;
  grantRoleName: string | undefined;
  grantPermissionCode: string | undefined;
};

@Injectable()
export class RbacCatalogueRepository {
  constructor(private readonly postgres: PostgresService) {}

  async catalogueCounts(): Promise<
    { roles: number; permissions: number } | undefined
  > {
    const result = await this.postgres.query<{
      roles: number;
      permissions: number;
    }>(
      `SELECT
         (SELECT COUNT(*)::int FROM roles) AS roles,
         (SELECT COUNT(*)::int FROM permissions) AS permissions`,
    );
    return result.rows[0];
  }

  writeCatalogue(input: CatalogueInput) {
    return this.postgres.withTransaction(async (query) =>
      this.writeInTransaction(query, input),
    );
  }

  private async writeInTransaction(query: SqlQuery, input: CatalogueInput) {
    let role: PublicRole | undefined;
    let permission: PublicPermission | undefined;
    let grant: { roleName: string; permissionCode: string } | undefined;

    if (input.roleName !== undefined) {
      const upserted = await query<{ role_id: number }>(
        `INSERT INTO roles (role_name, role_description)
         VALUES ($1, $2)
         ON CONFLICT (role_name) DO UPDATE
           SET role_description = coalesce(excluded.role_description, roles.role_description)
         RETURNING role_id`,
        [input.roleName, input.roleDescription],
      );
      const upsertedRow = upserted.rows[0];
      if (upsertedRow === undefined) {
        throw new Error('Role upsert returned no row');
      }
      const loaded = await query<RoleRow>(
        `${roleSelectSql} WHERE r.role_id = $1`,
        [upsertedRow.role_id],
      );
      const loadedRow = loaded.rows[0];
      if (loadedRow === undefined) {
        throw new Error('Role upsert could not be loaded');
      }
      role = toPublicRole(loadedRow);
    }

    if (input.permissionCode !== undefined) {
      const upserted = await query<PermissionRow>(
        `INSERT INTO permissions (permission_code, permission_description)
         VALUES ($1, $2)
         ON CONFLICT (permission_code) DO UPDATE
           SET permission_description = coalesce(excluded.permission_description, permissions.permission_description)
         RETURNING permission_id, permission_code, permission_description`,
        [input.permissionCode, input.permissionDescription],
      );
      const row = upserted.rows[0];
      if (row === undefined) {
        throw new Error('Permission upsert returned no row');
      }
      permission = toPublicPermission(row);
    }

    if (
      input.grantRoleName !== undefined &&
      input.grantPermissionCode !== undefined
    ) {
      const granted = await query<{ role_id: number }>(
        `INSERT INTO role_permissions (role_id, permission_id)
         SELECT r.role_id, p.permission_id
         FROM roles r
         JOIN permissions p ON p.permission_code = $2
         WHERE r.role_name = $1
         ON CONFLICT DO NOTHING
         RETURNING role_id`,
        [input.grantRoleName, input.grantPermissionCode],
      );
      if (granted.rows[0] === undefined) {
        const existing = await query<{ role_id: number }>(
          `SELECT rp.role_id
           FROM role_permissions rp
           JOIN roles r ON r.role_id = rp.role_id
           JOIN permissions p ON p.permission_id = rp.permission_id
           WHERE r.role_name = $1 AND p.permission_code = $2`,
          [input.grantRoleName, input.grantPermissionCode],
        );
        if (existing.rows[0] === undefined) {
          throw new NotFoundException('Role or permission not found for grant');
        }
      }
      grant = {
        roleName: input.grantRoleName,
        permissionCode: input.grantPermissionCode,
      };
    }

    return { role, permission, grant };
  }
}
