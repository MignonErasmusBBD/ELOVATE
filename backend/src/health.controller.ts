import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PostgresService } from './postgres.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly postgres: PostgresService) {}

  @Get()
  @ApiOperation({
    summary: 'Liveness + database ping',
    description:
      'Public. Confirms the API is up and the Postgres pool can query `roles`. Uses the repo-root `.env`. Does not require a JWT.',
  })
  async check() {
    try {
      const result = await this.postgres.query<{ roles: number }>(
        'SELECT COUNT(*)::int AS roles FROM roles',
      );
      const roleCount = result.rows[0]?.roles;
      return {
        status: 'ok',
        database: 'connected',
        roles: roleCount !== undefined ? roleCount : undefined,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'database error';
      return { status: 'ok', database: 'error', message };
    }
  }
}
