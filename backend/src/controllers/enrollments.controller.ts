import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiPropertyOptional, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID } from 'class-validator';
import { AuthGuard } from '../guards/auth.guard';
import { AuthUser, CurrentUser } from '../helpers/auth-user';
import { optionalText } from '../helpers/values';
import { EnrollmentsService } from '../services/enrollments.service';

class AssignDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsUUID()
  courseId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiPropertyOptional({ description: 'Calendar date YYYY-MM-DD in Africa/Johannesburg' })
  @IsOptional()
  @IsString()
  dueAt?: string;
}

class UpdateRequirementDto {
  @ApiProperty()
  @IsBoolean()
  isRequired: boolean;

  @ApiPropertyOptional({ description: 'Calendar date YYYY-MM-DD in Africa/Johannesburg' })
  @IsOptional()
  @IsString()
  dueAt?: string;
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
  constructor(private readonly enrollments: EnrollmentsService) {}

  @Get('me')
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'completed', 'withdrawn', 'overdue'] })
  @ApiOperation({
    summary: 'My enrollments',
    description:
      'Select enrollments for the caller.\nPermission: enrollment.read.self (educator, learner).',
  })
  mine(@CurrentUser() actor: AuthUser, @Query('status') status?: string) {
    return this.enrollments.listOwn(actor, optionalText(status));
  }

  @Get()
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'completed', 'withdrawn', 'overdue'] })
  @ApiOperation({
    summary: 'List enrollments',
    description:
      'Select enrollments joined to users/courses, plus completed quiz_attempts practiceAttemptCount and average practiceQuizPercent (from quiz_attempt_items). After a required due date, status becomes completed if the learner has at least 3 finished practice quizzes, otherwise overdue. With courseId: educators/org admins list students on that course (course.private.read / course.community.update / enrollment.assign). Without courseId: org-scoped list.\nPermission: enrollment.assign (org-wide) OR course authoring read when courseId is set.',
  })
  list(
    @CurrentUser() actor: AuthUser,
    @Query('organizationId') organizationId?: string,
    @Query('courseId') courseId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.enrollments.list(actor, {
      organizationId: optionalText(organizationId),
      courseId: optionalText(courseId),
      userId: optionalText(userId),
      status: optionalText(status),
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one enrollment',
    description:
      'Select enrollments by id, including completed quiz_attempts practiceAttemptCount and average practiceQuizPercent when present.\nPermission: enrollment.read.self (own row) or enrollment.assign (org).',
  })
  getOne(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.enrollments.getOne(actor, id);
  }

  @Post('assign')
  @ApiOperation({
    summary: 'Assign a user to a private course',
    description:
      'Insert or re-activate enrollments. Optional is_required and due_at (not in the past, Africa/Johannesburg).\nPermission: enrollment.assign (org_admin).\nV4 also has org_course_adoptions — not exposed; community courses use start-community.',
  })
  assign(@CurrentUser() actor: AuthUser, @Body() dto: AssignDto) {
    return this.enrollments.assign(actor, dto.userId, dto.courseId, {
      isRequired: dto.isRequired === true,
      dueAt: dto.dueAt,
    });
  }

  @Patch(':id/requirement')
  @ApiOperation({
    summary: 'Set required and due date on an enrolment',
    description:
      'Update enrollments.is_required and enrollments.due_at. Due date cannot be in the past (Africa/Johannesburg).\nPermission: enrollment.assign (org_admin, same org).',
  })
  updateRequirement(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateRequirementDto,
  ) {
    return this.enrollments.updateRequirement(actor, id, {
      isRequired: dto.isRequired,
      dueAt: dto.dueAt,
    });
  }

  @Post('start-community')
  @ApiOperation({
    summary: 'Auto-enrol on a community course',
    description:
      'Upsert enrollments for a community course.\nPermission: course.community.read (all roles).',
  })
  startCommunity(
    @CurrentUser() actor: AuthUser,
    @Body() dto: StartCommunityDto,
  ) {
    return this.enrollments.startCommunity(actor, dto.courseId);
  }

  @Post(':id/withdraw')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Withdraw',
    description:
      'Set enrollment_status_id from enrollment_statuses where status_code = withdrawn. Keep the row for history; do not delete it.\nPermission: enrollment.withdraw.self (own row) or enrollment.assign (org_admin, same org).',
  })
  withdraw(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.enrollments.withdraw(actor, id);
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Re-activate a withdrawn enrollment',
    description:
      'Set enrollment_status_id from enrollment_statuses where status_code = active.\nPermission: enrollment.assign (org_admin).',
  })
  activate(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.enrollments.activate(actor, id);
  }
}
