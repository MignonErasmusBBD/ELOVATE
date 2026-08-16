import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../guards/auth.guard';
import { AuthUser, CurrentUser } from '../helpers/auth-user';
import { optionalText } from '../helpers/values';
import { AnalyticsService } from '../services/analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analytics: AnalyticsService) {}

  @Get('me/overview')
  @ApiOperation({
    summary: 'My overall profile',
    description:
      'Select overall_learning_profile.\nPermission: analytics.read.self (org_admin, educator, learner).',
  })
  myOverview(@CurrentUser() actor: AuthUser) {
    return this.analytics.readOwnOverview(actor);
  }

  @Get('me/courses/:courseId')
  @ApiOperation({
    summary: 'My course mastery',
    description:
      'Select student_course_profile + student_topic_mastery + student_difficulty_mastery + student_bloom_mastery.\nPermission: analytics.read.self (org_admin, educator, learner).',
  })
  myCourse(
    @CurrentUser() actor: AuthUser,
    @Param('courseId') courseId: string,
  ) {
    return this.analytics.readOwnCourseMastery(actor, courseId);
  }

  @Get('org/overview')
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiOperation({
    summary: 'Org insights',
    description:
      'Aggregate student_course_profile for users in an org (optional course filter).\nPermission: analytics.read.org (org_admin, educator).\nV7 cohorts / cohort_members exist in DB but are not exposed yet.',
  })
  orgOverview(
    @CurrentUser() actor: AuthUser,
    @Query('organizationId') organizationId?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.analytics.readOrganizationOverview(
      actor,
      optionalText(organizationId),
      optionalText(courseId),
    );
  }

  @Get('org/attempts')
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiOperation({
    summary: 'Org attempt insights',
    description:
      'Aggregate quiz_attempts.\nPermission: analytics.read.attempts (org_admin, educator).',
  })
  orgAttempts(
    @CurrentUser() actor: AuthUser,
    @Query('organizationId') organizationId?: string,
    @Query('courseId') courseId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.analytics.readOrganizationAttempts(
      actor,
      optionalText(organizationId),
      optionalText(courseId),
      optionalText(userId),
    );
  }

  @Get('org/mastery')
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiOperation({
    summary: 'Org mastery insights',
    description:
      'Aggregate student_course_profile.\nPermission: analytics.read.mastery (org_admin, educator).',
  })
  orgMastery(
    @CurrentUser() actor: AuthUser,
    @Query('organizationId') organizationId?: string,
    @Query('courseId') courseId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.analytics.readOrganizationMastery(
      actor,
      optionalText(organizationId),
      optionalText(courseId),
      optionalText(userId),
    );
  }

  @Get('educator/courses/:courseId/overview')
  @ApiOperation({
    summary: 'Educator course overview dashboard',
    description:
      'Course-scoped KPIs and chart series: enrollments, active questions, bloom coverage + performance (student_bloom_mastery), questions per section, bloom×difficulty counts, open intervention_flags by rule.\nPermission: analytics.read.org (org_admin, educator) plus course.private.read / course.community.read for the course.',
  })
  educatorCourseOverview(
    @CurrentUser() actor: AuthUser,
    @Param('courseId') courseId: string,
  ) {
    return this.analytics.readEducatorCourseOverview(actor, courseId);
  }

  @Get('educator/courses/:courseId/practice-insights')
  @ApiOperation({
    summary: 'Educator course practice insights',
    description:
      'Derive completed quiz_attempts scores from quiz_attempt_items: class averages for attempts 1–6, course-wide average, ±2 SD outlier trajectories, normal density of learner mean scores, per-question success rates (too easy >95% / too hard <30%), plus rule-based insight strings.\nPermission: analytics.read.org (org_admin, educator) plus course.private.read / course.community.read for the course.',
  })
  educatorCoursePracticeInsights(
    @CurrentUser() actor: AuthUser,
    @Param('courseId') courseId: string,
  ) {
    return this.analytics.readEducatorCoursePracticeInsights(actor, courseId);
  }
}
