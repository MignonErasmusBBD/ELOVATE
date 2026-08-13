import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { AuthGuard } from './auth.guard';

class CreateCourseDto {
  @ApiProperty()
  @IsString()
  title: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ['private', 'community'] })
  @IsIn(['private', 'community'])
  visibility: 'private' | 'community';

  @ApiProperty({ required: false, description: 'Required for private courses (owning_organization_id)' })
  @IsOptional()
  @IsString()
  organizationId?: string;
}

class UpdateCourseDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

class CreateSectionDto {
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
  @Get('community')
  @ApiQuery({ name: 'search', required: false })
  @ApiOperation({
    summary: 'List community courses',
    description:
      'TODO: courses JOIN course_visibilities WHERE visibility_code = community.\nPermission: course.community.read (all roles).',
  })
  listCommunity(@Query('search') search?: string) {
    return { search, items: [], message: 'TODO' };
  }

  @Get()
  @ApiQuery({ name: 'organizationId', required: false, description: 'owning_organization_id' })
  @ApiQuery({ name: 'visibility', required: false, enum: ['private', 'community'] })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'deactivated'] })
  @ApiOperation({
    summary: 'List courses',
    description:
      'TODO: filter courses by org, visibility, search, status.\nPrivate: course.private.read (org_admin, educator). Community: course.community.read. Learners use enrollments for private.',
  })
  list(
    @Query('organizationId') organizationId?: string,
    @Query('visibility') visibility?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return { organizationId, visibility, search, status, items: [], message: 'TODO' };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get course',
    description:
      'TODO: select courses + sections/topics.\nCommunity: course.community.read. Private: course.private.read OR an enrollments row.\nowning_organization_id is NOT NULL in V3.',
  })
  getOne(@Param('id') id: string) {
    return { id, message: 'TODO' };
  }

  @Post()
  @ApiOperation({
    summary: 'Create course',
    description:
      'TODO: insert courses (course_visibility_id from course_visibilities).\nPermission: course.community.create (catalog_admin, org_admin, educator) OR course.private.create (org_admin, educator).',
  })
  create(@Body() _dto: CreateCourseDto) {
    return { message: 'TODO' };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update course',
    description:
      'TODO: update courses.\nPermission: course.community.update OR course.private.update (same roles as create).',
  })
  update(@Param('id') id: string, @Body() _dto: UpdateCourseDto) {
    return { id, message: 'TODO' };
  }

  @Post(':id/publish')
  @ApiOperation({
    summary: 'Publish to community',
    description:
      'TODO: set course_visibility_id to community (id 2).\nPermission: course.community.publish (catalog_admin, org_admin, educator).',
  })
  publish(@Param('id') id: string) {
    return { id, visibility: 'community', message: 'TODO' };
  }

  @Post(':id/unpublish')
  @ApiOperation({
    summary: 'Unpublish (back to private)',
    description:
      'TODO: set course_visibility_id to private (id 1).\nPermission: course.community.update / course.private.update.',
  })
  unpublish(@Param('id') id: string) {
    return { id, visibility: 'private', message: 'TODO' };
  }

  @Post(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate a course (keeps history)',
    description:
      'TODO: courses has no status column in V3 — needs a migration. Never hard-delete a course.\nPermission: course.private.delete / course.community.delete (deactivate, not HTTP DELETE).',
  })
  deactivate(@Param('id') id: string) {
    return { id, status: 'deactivated', message: 'TODO: missing courses.status in V3' };
  }

  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate a deactivated course',
    description:
      'TODO: set status back to active (same missing column).\nPermission: course.private.update / course.community.update.',
  })
  activate(@Param('id') id: string) {
    return { id, status: 'active', message: 'TODO: missing courses.status in V3' };
  }

  @Get(':id/sections')
  @ApiOperation({
    summary: 'List sections',
    description:
      'TODO: course_sections. Same visibility as GET course.\nNo lessons table in V3 — course.lesson.write is seeded but unused until a lessons migration.',
  })
  listSections(@Param('id') id: string) {
    return { courseId: id, items: [], message: 'TODO' };
  }

  @Get(':id/sections/:sectionId')
  @ApiOperation({
    summary: 'Get one section',
    description: 'TODO: course_sections by id.\nSame visibility as GET course.',
  })
  getSection(@Param('id') id: string, @Param('sectionId') sectionId: string) {
    return { courseId: id, sectionId, message: 'TODO' };
  }

  @Post(':id/sections')
  @ApiOperation({
    summary: 'Add section',
    description: 'TODO: insert course_sections.\nPermission: course.section.write (catalog_admin, org_admin, educator).',
  })
  addSection(@Param('id') id: string, @Body() _dto: CreateSectionDto) {
    return { courseId: id, message: 'TODO' };
  }

  @Patch(':id/sections/:sectionId')
  @ApiOperation({
    summary: 'Update section',
    description: 'TODO: update course_sections.\nPermission: course.section.write (catalog_admin, org_admin, educator).',
  })
  updateSection(
    @Param('id') id: string,
    @Param('sectionId') sectionId: string,
    @Body() _dto: CreateSectionDto,
  ) {
    return { courseId: id, sectionId, message: 'TODO' };
  }

  @Delete(':id/sections/:sectionId')
  @ApiOperation({
    summary: 'Delete section',
    description:
      'TODO: delete unused course_sections (authoring only). Do not use this to retire a course — deactivate the course instead.\nPermission: course.section.write (catalog_admin, org_admin, educator).',
  })
  removeSection(@Param('id') id: string, @Param('sectionId') sectionId: string) {
    return { courseId: id, sectionId, message: 'TODO' };
  }

  @Get(':id/topics')
  @ApiOperation({
    summary: 'List topics',
    description: 'TODO: topics (per-course). Used by question_topics.\nSame visibility as GET course.',
  })
  listTopics(@Param('id') id: string) {
    return { courseId: id, items: [] };
  }

  @Post(':id/topics')
  @ApiOperation({
    summary: 'Add topic',
    description: 'TODO: insert topics.\nPermission: course.section.write (catalog_admin, org_admin, educator).',
  })
  addTopic(@Param('id') id: string, @Body() _dto: CreateTopicDto) {
    return { courseId: id, message: 'TODO' };
  }

  @Patch(':id/topics/:topicId')
  @ApiOperation({
    summary: 'Rename topic',
    description: 'TODO: update topics.\nPermission: course.section.write (catalog_admin, org_admin, educator).',
  })
  updateTopic(
    @Param('id') id: string,
    @Param('topicId') topicId: string,
    @Body() _dto: CreateTopicDto,
  ) {
    return { courseId: id, topicId, message: 'TODO' };
  }

  @Delete(':id/topics/:topicId')
  @ApiOperation({
    summary: 'Delete topic',
    description:
      'TODO: delete unused topics + question_topics (authoring only). Do not use this to retire a course.\nPermission: course.section.write (catalog_admin, org_admin, educator).',
  })
  removeTopic(@Param('id') id: string, @Param('topicId') topicId: string) {
    return { courseId: id, topicId, message: 'TODO' };
  }
}
