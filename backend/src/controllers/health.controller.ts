import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RbacCatalogueRepository } from '../repositories/rbac-catalogue.repository';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly catalogue: RbacCatalogueRepository) {}

  @Get()
  @ApiOperation({
    summary: 'Liveness + database ping',
    description:
      'Public. Confirms the API is up and the Postgres pool can query `roles` and `permissions`. Uses the repo-root `.env`. Does not require a JWT.',
  })
  async check() {
    try {
      const counts = await this.catalogue.catalogueCounts();
      return {
        status: 'ok',
        database: 'connected',
        roles: counts === undefined ? undefined : counts.roles,
        permissions: counts === undefined ? undefined : counts.permissions,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'database error';
      return { status: 'ok', database: 'error', message };
    }
  }
}
