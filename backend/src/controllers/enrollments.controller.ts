import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { AuthGuard } from '../guards/auth.guard';

class AssignDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsUUID()
  courseId: string;
}

class StartCommunityDto {
  @ApiProperty()
  @IsUUID()
  courseId: string;
}

@ApiTags('Enrollments')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('enrollments')
export class EnrollmentsController {
  @Get('me')
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'completed', 'withdrawn'] })
  @ApiOperation({
    summary: 'My enrollments',
    description: 'TODO: enrollments for caller.\nPermission: enrollment.read.self (educator, learner).',
  })
  mine(@Query('status') status?: string) {
    return { status, items: [], message: 'TODO' };
  }

  @Get()
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'completed', 'withdrawn'] })
  @ApiOperation({
    summary: 'List enrollments',
    description:
      'TODO: enrollments joined to users/courses. Filter by org, course, user, status.\nPermission: enrollment.assign (org_admin) — used as manage-enrollments.',
  })
  list(
    @Query('organizationId') organizationId?: string,
    @Query('courseId') courseId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return { organizationId, courseId, userId, status, items: [], message: 'TODO' };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one enrollment',
    description: 'TODO: enrollments by id.\nPermission: enrollment.read.self (own row) or enrollment.assign (org).',
  })
  getOne(@Param('id') id: string) {
    return { id, message: 'TODO' };
  }

  @Post('assign')
  @ApiOperation({
    summary: 'Assign a user to a private course',
    description:
      'TODO: insert enrollments (enrollment_status_id = active / 1).\nPermission: enrollment.assign (org_admin).\nV4 also has org_course_adoptions — not exposed; community courses are listed without adopt.',
  })
  assign(@Body() _dto: AssignDto) {
    return { message: 'TODO' };
  }

  @Post('start-community')
  @ApiOperation({
    summary: 'Auto-enrol on a community course',
    description: 'TODO: upsert enrollments for a community course.\nPermission: course.community.read (all roles).',
  })
  startCommunity(@Body() _dto: StartCommunityDto) {
    return { message: 'TODO' };
  }

  @Post(':id/withdraw')
  @ApiOperation({
    summary: 'Withdraw',
    description: 'TODO: set enrollment_status_id = withdrawn (3). Keep the row for history; do not delete it.\nPermission: enrollment.withdraw.self (learner).',
  })
  withdraw(@Param('id') id: string) {
    return { id, status: 'withdrawn', message: 'TODO' };
  }

  @Post(':id/activate')
  @ApiOperation({
    summary: 'Re-activate a withdrawn enrollment',
    description: 'TODO: set enrollment_status_id = active (1).\nPermission: enrollment.assign (org_admin).',
  })
  activate(@Param('id') id: string) {
    return { id, status: 'active', message: 'TODO' };
  }
}
