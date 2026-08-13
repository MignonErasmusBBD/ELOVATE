import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiProperty, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';
import { AuthGuard } from '../guards/auth.guard';

class AssignRoleDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'educator' })
  @IsString()
  roleName: string;
}

@ApiTags('RBAC')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('rbac')
export class RbacController {
  @Get('roles')
  @ApiQuery({ name: 'name', required: false, description: 'Filter by role_name' })
  @ApiQuery({
    name: 'scope',
    required: false,
    enum: ['platform', 'org'],
    description: 'platform = platform_admin/catalog_admin; org = org_admin/educator/learner',
  })
  @ApiOperation({
    summary: 'List roles',
    description:
      'TODO: select roles (seeded: platform_admin, platform_catalog_admin, org_admin, educator, learner).\nPermission: role.read (platform_admin, org_admin).',
  })
  listRoles(@Query('name') name?: string, @Query('scope') scope?: string) {
    return { name, scope, items: [], message: 'TODO' };
  }

  @Get('roles/:roleName')
  @ApiOperation({
    summary: 'Get one role and its permissions',
    description: 'TODO: roles + role_permissions + permissions.\nPermission: role.read (platform_admin, org_admin).',
  })
  getRole(@Param('roleName') roleName: string) {
    return { roleName, permissions: [], message: 'TODO' };
  }

  @Get('permissions')
  @ApiQuery({ name: 'search', required: false, description: 'Match permission_code' })
  @ApiOperation({
    summary: 'List permission codes',
    description: 'TODO: select permissions.\nPermission: role.read (platform_admin, org_admin).',
  })
  listPermissions(@Query('search') search?: string) {
    return { search, items: [], message: 'TODO' };
  }

  @Get('assignments')
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'organizationId', required: false, description: 'Users in this org (join users.organization_id)' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role_name' })
  @ApiOperation({
    summary: 'List role grants',
    description: 'TODO: user_roles joined to users/roles. Filter by user, org, or role.\nPermission: role.read (platform_admin, org_admin).',
  })
  listAssignments(
    @Query('userId') userId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('role') role?: string,
  ) {
    return { userId, organizationId, role, items: [], message: 'TODO' };
  }

  @Post('assignments')
  @ApiOperation({
    summary: 'Grant an extra role (additive)',
    description: [
      'TODO: insert user_roles. PK is (user_id, role_id) — no organization_id on the grant.',
      'Signup already has learner. This only adds extra roles (educator, org_admin, …).',
      'Permission: role.assign (platform_admin, org_admin).',
    ].join('\n'),
  })
  assign(@Body() _dto: AssignRoleDto) {
    return { message: 'TODO' };
  }

  @Post('assignments/remove')
  @ApiOperation({
    summary: 'Unassign an extra role (keep the user)',
    description: [
      'TODO: delete that user_roles row only. Does not deactivate or delete the user.',
      'Never unassign learner. Never delete rows from roles / permissions.',
      'Permission: role.remove (platform_admin, org_admin).',
    ].join('\n'),
  })
  unassign(@Body() _dto: AssignRoleDto) {
    return { message: 'TODO' };
  }

  @Post('catalogue')
  @ApiOperation({
    summary: 'Add or update the role/permission catalogue',
    description: [
      'TODO: insert/update roles, permissions, role_permissions.',
      'Do not delete seeded roles. Users keep history; change grants via assign/unassign.',
      'Permission: role.catalogue.write (platform_admin).',
    ].join('\n'),
  })
  catalogue(@Body() _dto: Record<string, unknown>) {
    return { message: 'TODO' };
  }
}
