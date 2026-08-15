import { Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { AuthUser, CurrentUser } from '../helpers/auth-user';
import { optionalText } from '../helpers/values';
import { InterventionsService } from '../services/interventions.service';

@ApiTags('Interventions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('interventions')
export class InterventionsController {
  constructor(private readonly interventions: InterventionsService) {}

  @Get('flags')
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'acknowledged', 'resolved'] })
  @ApiOperation({
    summary: 'List flags',
    description:
      'Select intervention_flags joined to intervention_rules and lookup statuses. Filter by org/course/user/status.\nPermission: intervention.flag.read (org_admin, educator).',
  })
  list(
    @CurrentUser() actor: AuthUser,
    @Query('organizationId') organizationId?: string,
    @Query('courseId') courseId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.interventions.list(actor, {
      organizationId: optionalText(organizationId),
      courseId: optionalText(courseId),
      userId: optionalText(userId),
      status: optionalText(status),
    });
  }

  @Get('flags/:id')
  @ApiOperation({
    summary: 'Get one flag',
    description:
      'Select intervention_flags by id.\nPermission: intervention.flag.read (org_admin, educator).',
  })
  getOne(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.interventions.getOne(actor, id);
  }

  @Post('flags/:id/resolve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resolve a flag',
    description:
      'Set intervention_flag_status_id from intervention_flag_statuses where status_code = resolved, plus resolved_by and resolved_at.\nPermission: intervention.flag.resolve (org_admin).',
  })
  resolve(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.interventions.resolve(actor, id);
  }
}
