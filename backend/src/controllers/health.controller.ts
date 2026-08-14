import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostgresService } from '../services/postgres.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly postgres: PostgresService) {}

  @Get()
  @ApiOperation({
    summary: 'Liveness + database ping',
    description:
      'Public. Confirms the API is up and the Postgres pool can query `roles` and `permissions`. Uses the repo-root `.env`. Does not require a JWT.',
  })
  async check() {
    try {
      const result = await this.postgres.query<{
        roles: number;
        permissions: number;
      }>(
        `SELECT
           (SELECT COUNT(*)::int FROM roles) AS roles,
           (SELECT COUNT(*)::int FROM permissions) AS permissions`,
      );
      const row = result.rows[0];
      return {
        status: 'ok',
        database: 'connected',
        roles: row === undefined ? undefined : row.roles,
        permissions: row === undefined ? undefined : row.permissions,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'database error';
      return { status: 'ok', database: 'error', message };
    }
  }
}
