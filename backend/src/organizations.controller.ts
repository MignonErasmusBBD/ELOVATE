import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { AuthGuard } from './auth.guard';

class CreateOrgDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty()
  @IsString()
  slug: string;
}

class UpdateOrgDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;
}

@ApiTags('Organizations')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('organizations')
export class OrganizationsController {
  @Post()
  @ApiOperation({
    summary: 'Create organisation',
    description: 'TODO: insert organizations.\nPermission: org.create (platform_admin).',
  })
  create(@Body() _dto: CreateOrgDto) {
    return { message: 'TODO' };
  }

  @Get()
  @ApiQuery({ name: 'search', required: false, description: 'Match name or slug' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'suspended'] })
  @ApiOperation({
    summary: 'List organisations',
    description: 'TODO: select organizations, filter by search/status.\nPermission: org.read.all (platform_admin). Org members use GET :id instead.',
  })
  listAll(@Query('search') search?: string, @Query('status') status?: string) {
    return { search, status, items: [], message: 'TODO' };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get organisation by id',
    description: 'TODO: select organizations by id.\nPermission: org.read.self (platform_admin, org_admin, educator, learner) or org.read.all.',
  })
  getOne(@Param('id') id: string) {
    return { id, message: 'TODO' };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update organisation',
    description: 'TODO: update organizations.\nPermission: org.update.self (org_admin).',
  })
  update(@Param('id') id: string, @Body() _dto: UpdateOrgDto) {
    return { id, message: 'TODO' };
  }

  @Post(':id/suspend')
  @ApiOperation({
    summary: 'Suspend organisation',
    description:
      'TODO: V2 has no status column — needs a migration. Never hard-delete an organisation.\nPermission: org.suspend (platform_admin).',
  })
  suspend(@Param('id') id: string) {
    return { id, status: 'suspended', message: 'TODO: missing organizations.status in V2' };
  }

  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate a suspended organisation',
    description: 'TODO: set status back to active (same missing column as suspend).\nPermission: org.suspend (platform_admin).',
  })
  activate(@Param('id') id: string) {
    return { id, status: 'active', message: 'TODO: missing organizations.status in V2' };
  }
}
