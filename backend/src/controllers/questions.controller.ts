import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { AuthGuard } from '../guards/auth.guard';

class CreateQuestionDto {
  @ApiProperty()
  @IsUUID()
  courseSectionId: string;

  @ApiProperty({ example: 1, description: 'question_formats.question_format_id (1=mcq, 2=true_false, 3=short_answer)' })
  @IsNumber()
  questionFormatId: number;

  @ApiProperty()
  @IsString()
  prompt: string;

  @ApiProperty({ description: 'bloom_levels.bloom_level_id' })
  @IsNumber()
  bloomLevelId: number;

  @ApiProperty({ description: 'difficulty_levels.difficulty_level_id' })
  @IsNumber()
  difficultyLevelId: number;

  @ApiProperty()
  @IsNumber()
  baseDifficulty: number;

  @ApiProperty({ required: false, type: [String] })
  @IsOptional()
  @IsArray()
  topicIds?: string[];
}

@ApiTags('Questions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('questions')
export class QuestionsController {
  @Get()
  @ApiQuery({ name: 'sectionId', required: false })
  @ApiQuery({ name: 'courseId', required: false })
  @ApiQuery({ name: 'topicId', required: false })
  @ApiQuery({ name: 'bloomLevelId', required: false })
  @ApiQuery({ name: 'difficultyLevelId', required: false })
  @ApiQuery({ name: 'questionFormatId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'deactivated'] })
  @ApiOperation({
    summary: 'List questions (authors)',
    description:
      'TODO: questions + options + topics. Filter by section/course/topic/bloom/difficulty/format/status. Hide from learners.\nPermission: question.create (community_admin, org_admin, educator).',
  })
  list(
    @Query('sectionId') sectionId?: string,
    @Query('courseId') courseId?: string,
    @Query('topicId') topicId?: string,
    @Query('bloomLevelId') bloomLevelId?: string,
    @Query('difficultyLevelId') difficultyLevelId?: string,
    @Query('questionFormatId') questionFormatId?: string,
    @Query('status') status?: string,
  ) {
    return {
      sectionId,
      courseId,
      topicId,
      bloomLevelId,
      difficultyLevelId,
      questionFormatId,
      status,
      items: [],
      message: 'TODO',
    };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one question (authors)',
    description: 'TODO: questions + question_options + question_topics.\nPermission: question.update (community_admin, org_admin, educator).',
  })
  getOne(@Param('id') id: string) {
    return { id, message: 'TODO' };
  }

  @Post()
  @ApiOperation({
    summary: 'Create question',
    description: 'TODO: insert questions, question_options, question_topics.\nPermission: question.create (community_admin, org_admin, educator).',
  })
  create(@Body() _dto: CreateQuestionDto) {
    return { message: 'TODO' };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update question',
    description: 'TODO: update questions / options.\nPermission: question.update (community_admin, org_admin, educator).',
  })
  update(@Param('id') id: string, @Body() _dto: CreateQuestionDto) {
    return { id, message: 'TODO' };
  }

  @Patch(':id/topics')
  @ApiOperation({
    summary: 'Replace topic tags',
    description: 'TODO: rewrite question_topics.\nPermission: question.metadata.tag (community_admin, org_admin, educator).',
  })
  tag(@Param('id') id: string, @Body() _dto: { topicIds: string[] }) {
    return { id, message: 'TODO' };
  }

  @Post(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate a question (keeps quiz history)',
    description:
      'TODO: questions has no status column yet — needs a migration. Never hard-delete; quiz_attempt_items keep the prompt.\nPermission: question.delete (deactivate, not HTTP DELETE).',
  })
  deactivate(@Param('id') id: string) {
    return { id, status: 'deactivated', message: 'TODO: missing questions.status' };
  }

  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate a deactivated question',
    description:
      'TODO: set status back to active (same missing column).\nPermission: question.update (community_admin, org_admin, educator).',
  })
  activate(@Param('id') id: string) {
    return { id, status: 'active', message: 'TODO: missing questions.status' };
  }
}
