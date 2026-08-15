import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { AuthGuard } from '../guards/auth.guard';
import { AuthUser, CurrentUser } from '../helpers/auth-user';
import { optionalText, parseOptionalInteger } from '../helpers/values';
import { QuestionsService } from '../services/questions.service';

class QuestionOptionDto {
  @ApiProperty()
  @IsString()
  optionText: string;

  @ApiProperty()
  @IsBoolean()
  isCorrect: boolean;

  @ApiProperty()
  @IsInt()
  @Min(0)
  position: number;
}

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
  @IsUUID(4, { each: true })
  topicIds?: string[];

  @ApiProperty({ required: false, type: [QuestionOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];
}

class UpdateQuestionDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  questionFormatId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  bloomLevelId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  difficultyLevelId?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  baseDifficulty?: number;

  @ApiProperty({ required: false, type: [QuestionOptionDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOptionDto)
  options?: QuestionOptionDto[];
}

class TagTopicsDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsUUID(4, { each: true })
  topicIds: string[];
}

@ApiTags('Questions')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questions: QuestionsService) {}

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
      'Select questions + question_options + question_topics. Filter by section/course/topic/bloom/difficulty/format/status. Hidden from learners.\nPermission: question.create (community_admin, org_admin, educator).',
  })
  list(
    @CurrentUser() actor: AuthUser,
    @Query('sectionId') sectionId?: string,
    @Query('courseId') courseId?: string,
    @Query('topicId') topicId?: string,
    @Query('bloomLevelId') bloomLevelId?: string,
    @Query('difficultyLevelId') difficultyLevelId?: string,
    @Query('questionFormatId') questionFormatId?: string,
    @Query('status') status?: string,
  ) {
    return this.questions.list(actor, {
      sectionId: optionalText(sectionId),
      courseId: optionalText(courseId),
      topicId: optionalText(topicId),
      bloomLevelId: parseOptionalInteger(bloomLevelId),
      difficultyLevelId: parseOptionalInteger(difficultyLevelId),
      questionFormatId: parseOptionalInteger(questionFormatId),
      status: optionalText(status),
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get one question (authors)',
    description:
      'Select questions + question_options + question_topics.\nPermission: question.update or question.create (community_admin, org_admin, educator).',
  })
  getOne(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.questions.getOne(actor, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create question',
    description:
      'Insert questions, question_options, question_topics.\nPermission: question.create (community_admin, org_admin, educator).',
  })
  create(@CurrentUser() actor: AuthUser, @Body() dto: CreateQuestionDto) {
    return this.questions.create(actor, {
      courseSectionId: dto.courseSectionId,
      questionFormatId: dto.questionFormatId,
      prompt: dto.prompt,
      bloomLevelId: dto.bloomLevelId,
      difficultyLevelId: dto.difficultyLevelId,
      baseDifficulty: dto.baseDifficulty,
      topicIds: dto.topicIds,
      options: dto.options,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update question',
    description:
      'Update questions / options. Options cannot be replaced after quiz_attempt_items exist.\nPermission: question.update (community_admin, org_admin, educator).',
  })
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateQuestionDto,
  ) {
    return this.questions.update(actor, id, {
      prompt: dto.prompt,
      questionFormatId: dto.questionFormatId,
      bloomLevelId: dto.bloomLevelId,
      difficultyLevelId: dto.difficultyLevelId,
      baseDifficulty: dto.baseDifficulty,
      options: dto.options,
    });
  }

  @Patch(':id/topics')
  @ApiOperation({
    summary: 'Replace topic tags',
    description:
      'Rewrite question_topics. Topics must belong to the same course.\nPermission: question.metadata.tag (community_admin, org_admin, educator).',
  })
  tag(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: TagTopicsDto,
  ) {
    return this.questions.replaceTopics(actor, id, dto.topicIds);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate a question (keeps quiz history)',
    description:
      'Set question_status_id to deactivated. Never hard-delete; quiz_attempt_items keep the prompt.\nPermission: question.delete (deactivate, not HTTP DELETE).',
  })
  deactivate(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.questions.setStatus(actor, id, 'deactivated');
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate a deactivated question',
    description:
      'Set question_status_id back to active.\nPermission: question.update (community_admin, org_admin, educator).',
  })
  activate(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.questions.setStatus(actor, id, 'active');
  }
}
