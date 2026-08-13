import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';

@ApiTags('Interventions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('interventions')
export class InterventionsController {
  @Get('flags')
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'acknowledged', 'resolved'] })
  @ApiOperation({
    summary: 'List flags',
    description:
      'TODO: intervention_flags (+ intervention_rules). Filter by org/course/user/status.\nPermission: intervention.flag.read (org_admin, educator).',
  })
  list(
    @Query('organizationId') organizationId?: string,
    @Query('courseId') courseId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return { organizationId, courseId, userId, status, items: [], message: 'TODO' };
  }

  @Get('flags/:id')
  @ApiOperation({
    summary: 'Get one flag',
    description: 'TODO: intervention_flags by id.\nPermission: intervention.flag.read (org_admin, educator).',
  })
  getOne(@Param('id') id: string) {
    return { id, message: 'TODO' };
  }

  @Post('flags/:id/resolve')
  @ApiOperation({
    summary: 'Resolve a flag',
    description:
      'TODO: intervention_flag_status_id = resolved (3), resolved_by, resolved_at.\nPermission: intervention.flag.resolve (org_admin).',
  })
  resolve(@Param('id') id: string) {
    return { id, status: 'resolved', message: 'TODO' };
  }
}
