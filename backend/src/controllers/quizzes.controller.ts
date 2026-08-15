import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { AuthGuard } from '../guards/auth.guard';
import { AuthUser, CurrentUser } from '../helpers/auth-user';
import { optionalText } from '../helpers/values';
import { QuizzesService } from '../services/quizzes.service';

class GenerateDto {
  @ApiProperty()
  @IsUUID()
  courseId: string;
}

class AnswerDto {
  @ApiProperty()
  @IsUUID()
  quizAttemptItemId: string;

  @ApiProperty()
  @IsUUID()
  selectedOptionId: string;
}

@ApiTags('Quizzes')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('quizzes')
export class QuizzesController {
  constructor(private readonly quizzes: QuizzesService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate a practice quiz',
    description: [
      'Select active questions for the course; insert quiz_attempts, quiz_attempt_items, quiz_topic_weights, quiz_difficulty_weights, quiz_bloom_weights.',
      'Permission: quiz.attempt (educator, learner). Requires an active enrollments row.',
    ].join('\n'),
  })
  generate(@CurrentUser() actor: AuthUser, @Body() dto: GenerateDto) {
    return this.quizzes.generate(actor, dto.courseId);
  }

  @Get('me')
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['generated', 'in_progress', 'completed', 'abandoned'] })
  @ApiOperation({
    summary: 'My attempts',
    description:
      'Select quiz_attempts for the caller.\nPermission: quiz.read.self (educator, learner).',
  })
  mine(
    @CurrentUser() actor: AuthUser,
    @Query('courseId') courseId?: string,
    @Query('status') status?: string,
  ) {
    return this.quizzes.listOwn(actor, {
      courseId: optionalText(courseId),
      status: optionalText(status),
    });
  }

  @Get('org')
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['generated', 'in_progress', 'completed', 'abandoned'] })
  @ApiOperation({
    summary: 'Org attempts',
    description:
      'Select quiz_attempts for users in an organisation.\nPermission: quiz.read.org (org_admin, educator).',
  })
  org(
    @CurrentUser() actor: AuthUser,
    @Query('organizationId') organizationId?: string,
    @Query('courseId') courseId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return this.quizzes.listForOrganization(actor, {
      organizationId: optionalText(organizationId),
      courseId: optionalText(courseId),
      userId: optionalText(userId),
      status: optionalText(status),
    });
  }

  @Get(':attemptId')
  @ApiOperation({
    summary: 'Get one attempt',
    description:
      'Select quiz_attempts + quiz_attempt_items (hide is_correct while generated or in_progress).\nPermission: quiz.read.self (own) or quiz.read.org.',
  })
  getOne(@CurrentUser() actor: AuthUser, @Param('attemptId') attemptId: string) {
    return this.quizzes.getOne(actor, attemptId);
  }

  @Post(':attemptId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Start attempt',
    description:
      'Set started_at and quiz_attempt_status_id from quiz_attempt_statuses where status_code = in_progress.\nPermission: quiz.attempt (educator, learner).',
  })
  start(@CurrentUser() actor: AuthUser, @Param('attemptId') attemptId: string) {
    return this.quizzes.start(actor, attemptId);
  }

  @Post(':attemptId/answer')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit one answer',
    description:
      'Update quiz_attempt_items.selected_option_id / is_correct / answered_at.\nPermission: quiz.attempt (educator, learner).',
  })
  answer(
    @CurrentUser() actor: AuthUser,
    @Param('attemptId') attemptId: string,
    @Body() dto: AnswerDto,
  ) {
    return this.quizzes.answer(
      actor,
      attemptId,
      dto.quizAttemptItemId,
      dto.selectedOptionId,
    );
  }

  @Post(':attemptId/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Score quiz and update profiles',
    description: [
      'Set quiz_attempt_status_id to completed and rating_at_completion.',
      'Update student_course_profile, student_topic_mastery, student_difficulty_mastery, student_bloom_mastery, overall_learning_profile.',
      'Permission: quiz.attempt (educator, learner).',
    ].join('\n'),
  })
  complete(@CurrentUser() actor: AuthUser, @Param('attemptId') attemptId: string) {
    return this.quizzes.complete(actor, attemptId);
  }
}
