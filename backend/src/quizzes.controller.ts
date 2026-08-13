import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { AuthGuard } from './auth.guard';

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
  @Post('generate')
  @ApiOperation({
    summary: 'Generate a practice quiz',
    description: [
      'TODO: read student_course_profile / student_topic_mastery / student_difficulty_mastery / student_bloom_mastery;',
      'insert quiz_attempts, quiz_attempt_items, quiz_topic_weights, quiz_difficulty_weights, quiz_bloom_weights.',
      'Permission: quiz.attempt (educator, learner). Requires an enrollments row.',
    ].join('\n'),
  })
  generate(@Body() _dto: GenerateDto) {
    return { message: 'TODO' };
  }

  @Get('me')
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['generated', 'in_progress', 'completed', 'abandoned'] })
  @ApiOperation({
    summary: 'My attempts',
    description: 'TODO: quiz_attempts for caller.\nPermission: quiz.read.self (educator, learner).',
  })
  mine(@Query('courseId') courseId?: string, @Query('status') status?: string) {
    return { courseId, status, items: [], message: 'TODO' };
  }

  @Get('org')
  @ApiQuery({ name: 'organizationId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['generated', 'in_progress', 'completed', 'abandoned'] })
  @ApiOperation({
    summary: 'Org attempts',
    description: 'TODO: quiz_attempts for users in an organisation.\nPermission: quiz.read.org (org_admin, educator).',
  })
  org(
    @Query('organizationId') organizationId?: string,
    @Query('courseId') courseId?: string,
    @Query('userId') userId?: string,
    @Query('status') status?: string,
  ) {
    return { organizationId, courseId, userId, status, items: [], message: 'TODO' };
  }

  @Get(':attemptId')
  @ApiOperation({
    summary: 'Get one attempt',
    description: 'TODO: quiz_attempts + quiz_attempt_items (hide is_correct while in progress).\nPermission: quiz.read.self (own) or quiz.read.org.',
  })
  getOne(@Param('attemptId') attemptId: string) {
    return { attemptId, items: [], message: 'TODO' };
  }

  @Post(':attemptId/start')
  @ApiOperation({
    summary: 'Start attempt',
    description: 'TODO: set started_at, quiz_attempt_status_id = in_progress (2).\nPermission: quiz.attempt (educator, learner).',
  })
  start(@Param('attemptId') attemptId: string) {
    return { attemptId, message: 'TODO' };
  }

  @Post(':attemptId/answer')
  @ApiOperation({
    summary: 'Submit one answer',
    description: 'TODO: update quiz_attempt_items.selected_option_id / is_correct / answered_at.\nPermission: quiz.attempt (educator, learner).',
  })
  answer(@Param('attemptId') attemptId: string, @Body() _dto: AnswerDto) {
    return { attemptId, message: 'TODO' };
  }

  @Post(':attemptId/complete')
  @ApiOperation({
    summary: 'Score quiz and update profiles',
    description: [
      'TODO: quiz_attempt_status_id = completed (3); set rating_at_completion;',
      'update student_course_profile, student_topic_mastery, student_difficulty_mastery, student_bloom_mastery, overall_learning_profile.',
      'Permission: quiz.attempt (educator, learner).',
    ].join('\n'),
  })
  complete(@Param('attemptId') attemptId: string) {
    return { attemptId, message: 'TODO' };
  }
}
