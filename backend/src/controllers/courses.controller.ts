import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AuthGuard } from '../guards/auth.guard';
import { AuthUser, CurrentUser } from '../helpers/auth-user';
import { optionalText } from '../helpers/values';
import { CoursesService } from '../services/courses.service';

class CreateCourseDto {
  @ApiProperty()
  @IsString()
  @MaxLength(80)
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;

  @ApiProperty({ enum: ['private', 'community'] })
  @IsIn(['private', 'community'])
  visibility: 'private' | 'community';

  @ApiProperty({ required: false, description: 'Must match the caller owning_organization_id when sent' })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

class UpdateCourseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  @MaxLength(280)
  description?: string;
}

class SectionContentBlockDto {
  @ApiProperty({ enum: ['text', 'code'] })
  @IsIn(['text', 'code'])
  contentType: 'text' | 'code';

  @ApiProperty()
  @IsString()
  bodyText: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  position: number;
}

class CreateSectionDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;

  @ApiProperty({ required: false, type: [SectionContentBlockDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionContentBlockDto)
  contentBlocks?: SectionContentBlockDto[];
}

class ReplaceSectionDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  position: number;

  @ApiProperty({ type: [SectionContentBlockDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionContentBlockDto)
  contentBlocks: SectionContentBlockDto[];
}

class PatchSectionDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  position: number;
}

class CreateTopicDto {
  @ApiProperty()
  @IsString()
  name: string;
}

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Get('community')
  @ApiQuery({ name: 'search', required: false })
  @ApiOperation({
    summary: 'List community courses',
    description:
      'Select courses JOIN course_visibilities WHERE visibility_code = community and status is active.\nPermission: course.community.read (all roles).',
  })
  listCommunity(
    @CurrentUser() actor: AuthUser,
    @Query('search') search?: string,
  ) {
    return this.courses.listCommunity(actor, optionalText(search));
  }

  @Get()
  @ApiQuery({ name: 'organizationId', required: false, description: 'owning_organization_id' })
  @ApiQuery({ name: 'visibility', required: false, enum: ['private', 'community'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'deactivated', 'all'] })
  @ApiOperation({
    summary: 'List courses',
    description:
      'Select courses JOIN course_visibilities JOIN course_statuses. Filter by owning_organization_id, visibility_code, search, and status_code (defaults to active; status=all includes deactivated when the caller has course.*.update or course.*.delete).\nPermission: course.community.read (all roles) and/or course.private.read (org_admin, educator, community_admin). Learners also see private courses they have an active enrollments row for.',
  })
  list(
    @CurrentUser() actor: AuthUser,
    @Query('organizationId') organizationId?: string,
    @Query('visibility') visibility?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.courses.list(actor, {
      organizationId: optionalText(organizationId),
      visibility: optionalText(visibility),
      search: optionalText(search),
      status: optionalText(status),
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get course',
    description:
      'Select courses + course_sections (with course_section_content) + topics.\nCommunity: course.community.read. Private: course.private.read in the same org, or an active enrollments row.\nCommunity courses may omit owning_organization_id (V12).',
  })
  getOne(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.courses.getOne(actor, id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create course',
    description:
      'Insert courses (course_visibility_id from course_visibilities, course_status_id defaults to deactivated). Community courses do not require an organisation. Private courses use the caller org.\nPermission: course.community.create (community_admin, org_admin, educator) OR course.private.create (org_admin, educator).',
  })
  create(@CurrentUser() actor: AuthUser, @Body() dto: CreateCourseDto) {
    return this.courses.create(actor, {
      title: dto.title,
      description: dto.description,
      visibility: dto.visibility,
      organizationId: dto.organizationId,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update course',
    description:
      'Update courses title/description.\nPermission: course.community.update OR course.private.update (same roles as create).',
  })
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ) {
    return this.courses.update(actor, id, {
      title: dto.title,
      description: dto.description,
    });
  }

  @Post(':id/publish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Publish to community',
    description:
      'Set course_visibility_id from course_visibilities where visibility_code = community.\nPermission: course.community.publish (community_admin, org_admin, educator). Private courses must belong to the caller org.',
  })
  publish(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.courses.publish(actor, id);
  }

  @Post(':id/unpublish')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unpublish (back to private)',
    description:
      'Set course_visibility_id from course_visibilities where visibility_code = private.\nPermission: course.community.update / course.private.update.',
  })
  unpublish(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.courses.unpublish(actor, id);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate a course (keeps history)',
    description:
      'Set course_status_id to deactivated. Never hard-delete a course.\nPermission: course.private.delete / course.community.delete (deactivate, not HTTP DELETE).',
  })
  deactivate(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.courses.setStatus(actor, id, 'deactivated');
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate a deactivated course',
    description:
      'Set course_status_id back to active.\nPermission: course.private.update / course.community.update.',
  })
  activate(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.courses.setStatus(actor, id, 'active');
  }

  @Get(':id/sections')
  @ApiOperation({
    summary: 'List sections',
    description:
      'Select course_sections with nested course_section_content (content_types text|code).\nSame visibility as GET course.\nPermission: course.community.read / course.private.read (or active enrollment).',
  })
  listSections(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.courses.listSections(actor, id);
  }

  @Get(':id/sections/:sectionId')
  @ApiOperation({
    summary: 'Get one section',
    description:
      'Select course_sections by id with nested course_section_content.\nSame visibility as GET course.',
  })
  getSection(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.courses.getSection(actor, id, sectionId);
  }

  @Post(':id/sections')
  @ApiOperation({
    summary: 'Add section',
    description:
      'Insert course_sections and optional course_section_content rows.\nPermission: course.section.write (community_admin, org_admin, educator).',
  })
  addSection(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateSectionDto,
  ) {
    return this.courses.addSection(
      actor,
      id,
      dto.title,
      dto.position === undefined ? 0 : dto.position,
      dto.contentBlocks,
    );
  }

  @Put(':id/sections/:sectionId')
  @ApiOperation({
    summary: 'Replace section and content blocks',
    description:
      'Update course_sections title/position and replace all course_section_content for the section.\nPermission: course.section.write (community_admin, org_admin, educator).',
  })
  replaceSection(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: ReplaceSectionDto,
  ) {
    return this.courses.replaceSection(
      actor,
      id,
      sectionId,
      dto.title,
      dto.position,
      dto.contentBlocks,
    );
  }

  @Patch(':id/sections/:sectionId')
  @ApiOperation({
    summary: 'Update section title/position',
    description:
      'Update course_sections title and position only (content blocks unchanged).\nPermission: course.section.write (community_admin, org_admin, educator).',
  })
  updateSection(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() dto: PatchSectionDto,
  ) {
    return this.courses.updateSection(actor, id, sectionId, dto.title, dto.position);
  }

  @Delete(':id/sections/:sectionId')
  @ApiOperation({
    summary: 'Delete section',
    description:
      'Delete unused course_sections (authoring only); course_section_content cascades. 409 if the section still has questions. Do not use this to retire a course — deactivate the course instead.\nPermission: course.section.write (community_admin, org_admin, educator).',
  })
  removeSection(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
  ) {
    return this.courses.removeSection(actor, id, sectionId);
  }

  @Get(':id/topics')
  @ApiOperation({
    summary: 'List topics',
    description:
      'Select topics (per-course). Used by question_topics.\nSame visibility as GET course.',
  })
  listTopics(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.courses.listTopics(actor, id);
  }

  @Post(':id/topics')
  @ApiOperation({
    summary: 'Add topic',
    description:
      'Insert topics.\nPermission: course.section.write (community_admin, org_admin, educator).',
  })
  addTopic(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: CreateTopicDto,
  ) {
    return this.courses.addTopic(actor, id, dto.name);
  }

  @Patch(':id/topics/:topicId')
  @ApiOperation({
    summary: 'Rename topic',
    description:
      'Update topics.name.\nPermission: course.section.write (community_admin, org_admin, educator).',
  })
  updateTopic(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Param('topicId') topicId: string,
    @Body() dto: CreateTopicDto,
  ) {
    return this.courses.updateTopic(actor, id, topicId, dto.name);
  }

  @Delete(':id/topics/:topicId')
  @ApiOperation({
    summary: 'Delete topic',
    description:
      'Delete unused topics + question_topics (authoring only). Do not use this to retire a course.\nPermission: course.section.write (community_admin, org_admin, educator).',
  })
  removeTopic(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Param('topicId') topicId: string,
  ) {
    return this.courses.removeTopic(actor, id, topicId);
  }
}
