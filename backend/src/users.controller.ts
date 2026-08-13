import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString } from 'class-validator';
import { AuthGuard } from './auth.guard';

class InviteDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Organisation to invite into' })
  @IsString()
  organizationId: string;

  @ApiProperty({ required: false, example: 'educator' })
  @IsOptional()
  @IsString()
  roleName?: string;
}

class UpdateUserDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  fullName?: string;
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  @Get('me')
  @ApiOperation({
    summary: 'Current profile + roles',
    description: 'TODO: users + user_roles + role_permissions.\nPermission: user.read.self (all roles).',
  })
  me() {
    return { message: 'TODO' };
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update own profile',
    description: 'TODO: update users.full_name.\nPermission: user.update.self (all roles).',
  })
  updateMe(@Body() _dto: UpdateUserDto) {
    return { message: 'TODO' };
  }

  @Get()
  @ApiQuery({ name: 'organizationId', required: false, description: 'Filter by users.organization_id' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role_name (join user_roles)' })
  @ApiQuery({ name: 'search', required: false, description: 'Match email or full_name' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'deactivated'] })
  @ApiOperation({
    summary: 'List users',
    description:
      'TODO: select users, filter by organizationId / role / search / status.\nOrg Admin: own org only. Platform Admin: any org (or omit organizationId for all).\nPermission: user.read.org (platform_admin, org_admin, educator) or user.read.all (platform_admin).',
  })
  list(
    @Query('organizationId') organizationId?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return { organizationId, role, search, status, items: [], message: 'TODO' };
  }

  @Post('invite')
  @ApiOperation({
    summary: 'Invite user into an organisation',
    description:
      'TODO: insert users (organization_id) + user_roles learner, optional extra role.\nPermission: user.invite (org_admin). Extra role also needs role.assign.',
  })
  invite(@Body() _dto: InviteDto) {
    return { message: 'TODO' };
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by id',
    description: 'TODO: select users + roles.\nPermission: user.read.org (same org) or user.read.all or user.read.self.',
  })
  getOne(@Param('id') id: string) {
    return { id, message: 'TODO' };
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a user in the organisation',
    description: 'TODO: update users.full_name.\nPermission: user.update.org (org_admin).',
  })
  update(@Param('id') id: string, @Body() _dto: UpdateUserDto) {
    return { id, message: 'TODO' };
  }

  @Post(':id/deactivate')
  @ApiOperation({
    summary: 'Deactivate a user',
    description:
      'TODO: users has no status column in V2 — needs a migration. Never hard-delete a user.\nPermission: user.deactivate (org_admin).',
  })
  deactivate(@Param('id') id: string) {
    return { id, status: 'deactivated', message: 'TODO: missing users.status in V2' };
  }

  @Post(':id/activate')
  @ApiOperation({
    summary: 'Activate a deactivated user',
    description: 'TODO: set status back to active (same missing column).\nPermission: user.deactivate (org_admin).',
  })
  activate(@Param('id') id: string) {
    return { id, status: 'active', message: 'TODO: missing users.status in V2' };
  }
}
