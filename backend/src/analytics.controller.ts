import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('analytics')
export class AnalyticsController {
  @Get('me/overview')
  @ApiOperation({
    summary: 'My overall profile',
    description: 'TODO: overall_learning_profile.\nPermission: analytics.read.self (org_admin, educator, learner).',
  })
  myOverview() {
    return { message: 'TODO' };
  }

  @Get('me/courses/:courseId')
  @ApiOperation({
    summary: 'My course mastery',
    description:
      'TODO: student_course_profile + student_topic_mastery + student_difficulty_mastery + student_bloom_mastery.\nPermission: analytics.read.self (org_admin, educator, learner).',
  })
  myCourse(@Param('courseId') courseId: string) {
    return { courseId, message: 'TODO' };
  }

  @Get('org/overview')
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiOperation({
    summary: 'Org insights',
    description:
      'TODO: aggregate profiles for users in an org (optional course filter).\nPermission: analytics.read.org (org_admin, educator).\nV7 cohorts / cohort_members exist in DB but are not exposed yet.',
  })
  orgOverview(@Query('organizationId') organizationId?: string, @Query('courseId') courseId?: string) {
    return { organizationId, courseId, message: 'TODO' };
  }

  @Get('org/attempts')
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiOperation({
    summary: 'Org attempt insights',
    description: 'TODO: aggregate quiz_attempts.\nPermission: analytics.read.attempts (org_admin, educator).',
  })
  orgAttempts(
    @Query('organizationId') organizationId?: string,
    @Query('courseId') courseId?: string,
    @Query('userId') userId?: string,
  ) {
    return { organizationId, courseId, userId, message: 'TODO' };
  }

  @Get('org/mastery')
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiOperation({
    summary: 'Org mastery insights',
    description: 'TODO: aggregate student_*_mastery tables.\nPermission: analytics.read.mastery (org_admin, educator).',
  })
  orgMastery(
    @Query('organizationId') organizationId?: string,
    @Query('courseId') courseId?: string,
    @Query('userId') userId?: string,
  ) {
    return { organizationId, courseId, userId, message: 'TODO' };
  }
}
