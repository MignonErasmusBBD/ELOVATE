import { Injectable } from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { SqlParameter, textFromDatabase } from '../helpers/values';
import { PostgresService } from './postgres.service';

type AuthUserRow = {
  id: string;
  organization_id: string;
  email: string;
  full_name: string | null;
  status: string;
};

@Injectable()
export class AuthContextService {
  constructor(private readonly postgres: PostgresService) {}

  async loadById(id: string): Promise<AuthUser | undefined> {
    return this.load(
      `SELECT u.id, u.organization_id, u.email, u.full_name, us.status_code AS status
       FROM users u
       JOIN user_statuses us ON us.user_status_id = u.user_status_id
       WHERE u.id = $1`,
      [id],
    );
  }

  private async load(
    sql: string,
    values: SqlParameter[],
  ): Promise<AuthUser | undefined> {
    const result = await this.postgres.query<AuthUserRow>(sql, values);
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
      organizationId: row.organization_id,
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
