import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { AuthGuard } from '../guards/auth.guard';
import { AuthUser, CurrentUser } from '../helpers/auth-user';
import { optionalText } from '../helpers/values';
import { OrganizationsService } from '../services/organizations.service';

class CreateOrgDto {
  @ApiProperty()
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({
    required: false,
    type: [String],
    description: 'Users to place in the org and grant org_admin',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  adminUserIds?: string[];
}

class AddMemberDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;
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
  constructor(private readonly organizations: OrganizationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create organisation',
    description:
      'Insert organizations (status defaults to active). Slug is generated from the name when omitted. Optional adminUserIds are placed in the org and granted org_admin.\nPermission: org.create (platform_admin).',
  })
  create(@CurrentUser() actor: AuthUser, @Body() dto: CreateOrgDto) {
    return this.organizations.create(
      actor,
      dto.name,
      optionalText(dto.slug),
      dto.adminUserIds,
    );
  }

  @Get()
  @ApiQuery({ name: 'search', required: false, description: 'Match name or slug' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'suspended'] })
  @ApiOperation({
    summary: 'List organisations',
    description:
      'Select organizations, filter by search/status.\nPermission: org.read.all (platform_admin). Org members use GET :id instead.',
  })
  listAll(
    @CurrentUser() actor: AuthUser,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.organizations.list(actor, {
      search: optionalText(search),
      status: optionalText(status),
    });
  }

  @Post(':id/members')
  @ApiOperation({
    summary: 'Place a user in an organisation',
    description:
      'Set users.organization_id and grant org_admin. Rejects users who already belong to an organisation.\nPermission: org.create (platform_admin).',
  })
  addMember(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.organizations.addMember(actor, id, dto.userId);
  }

  @Post(':id/members/remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Remove a user from an organisation',
    description:
      'Clear users.organization_id and remove org_admin if present. Does not delete the user.\nPermission: org.create (platform_admin).',
  })
  removeMember(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
  ) {
    return this.organizations.removeMember(actor, id, dto.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get organisation by id',
    description:
      'Select organizations by id.\nPermission: org.read.self (platform_admin, org_admin, educator, learner) for own org, or org.read.all.',
  })
  getOne(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.organizations.getOne(actor, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update organisation',
    description:
      'Update organizations.name. Own organisation only.\nPermission: org.update.self (org_admin).',
  })
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateOrgDto,
  ) {
    return this.organizations.update(actor, id, dto.name);
  }

  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Suspend organisation',
    description:
      'Set organization_status_id to suspended. Never hard-delete an organisation.\nPermission: org.suspend (platform_admin).',
  })
  suspend(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.organizations.setStatus(actor, id, 'suspended');
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate a suspended organisation',
    description:
      'Set organization_status_id back to active.\nPermission: org.suspend (platform_admin).',
  })
  activate(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.organizations.setStatus(actor, id, 'active');
  }
}
