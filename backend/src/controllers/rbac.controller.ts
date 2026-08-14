import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';
import { AuthGuard } from '../guards/auth.guard';
import { AuthUser, CurrentUser } from '../helpers/auth-user';
import { optionalText } from '../helpers/values';
import { RbacService } from '../services/rbac.service';

class AssignRoleDto {
  @ApiProperty()
  @IsUUID()
  userId: string;

  @ApiProperty({ example: 'educator' })
  @IsString()
  roleName: string;
}

class CatalogueDto {
  @ApiProperty({ required: false, description: 'Upsert this role_name' })
  @IsOptional()
  @IsString()
  roleName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  roleDescription?: string;

  @ApiProperty({ required: false, description: 'Upsert this permission_code' })
  @IsOptional()
  @IsString()
  permissionCode?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  permissionDescription?: string;

  @ApiProperty({ required: false, description: 'Add a role_permissions grant' })
  @IsOptional()
  @IsString()
  grantRoleName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  grantPermissionCode?: string;
}

@ApiTags('RBAC')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('rbac')
export class RbacController {
  constructor(private readonly rbac: RbacService) {}

  @Get('roles')
  @ApiQuery({ name: 'name', required: false, description: 'Filter by role_name' })
  @ApiOperation({
    summary: 'List roles',
    description: 'Select roles.\nPermission: role.read (platform_admin, org_admin).',
  })
  listRoles(
    @CurrentUser() actor: AuthUser,
    @Query('name') name?: string,
  ) {
    return this.rbac.listRoles(actor, {
      name: optionalText(name),
    });
  }

  @Get('roles/:roleName')
  @ApiOperation({
    summary: 'Get one role and its permissions',
    description:
      'roles + role_permissions + permissions.\nPermission: role.read (platform_admin, org_admin).',
  })
  getRole(@CurrentUser() actor: AuthUser, @Param('roleName') roleName: string) {
    return this.rbac.getRole(actor, roleName);
  }

  @Get('permissions')
  @ApiQuery({ name: 'search', required: false, description: 'Match permission_code' })
  @ApiOperation({
    summary: 'List permission codes',
    description: 'Select permissions.\nPermission: role.read (platform_admin, org_admin).',
  })
  listPermissions(
    @CurrentUser() actor: AuthUser,
    @Query('search') search?: string,
  ) {
    return this.rbac.listPermissions(actor, optionalText(search));
  }

  @Get('assignments')
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({
    name: 'organizationId',
    required: false,
    description: 'Users in this org (join users.organization_id)',
  })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role_name' })
  @ApiOperation({
    summary: 'List role grants',
    description:
      'user_roles joined to users/roles. Org-scoped callers are limited to their organisation.\nPermission: role.read (platform_admin, org_admin).',
  })
  listAssignments(
    @CurrentUser() actor: AuthUser,
    @Query('userId') userId?: string,
    @Query('organizationId') organizationId?: string,
    @Query('role') role?: string,
  ) {
    return this.rbac.listAssignments(actor, {
      userId: optionalText(userId),
      organizationId: optionalText(organizationId),
      role: optionalText(role),
    });
  }

  @Post('assignments')
  @ApiOperation({
    summary: 'Grant an extra role (additive)',
    description: [
      'Insert user_roles. PK is (user_id, role_id) — no organization_id on the grant.',
      'Signup already has learner. This only adds extra roles.',
      'Permission: role.assign (platform_admin, org_admin).',
    ].join('\n'),
  })
  assign(@CurrentUser() actor: AuthUser, @Body() dto: AssignRoleDto) {
    return this.rbac.assign(actor, dto.userId, dto.roleName);
  }

  @Post('assignments/remove')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unassign an extra role (keep the user)',
    description: [
      'Delete that user_roles row only. Does not deactivate or delete the user.',
      'Never unassign learner. Never delete rows from roles / permissions.',
      'Permission: role.remove (platform_admin, org_admin).',
    ].join('\n'),
  })
  unassign(@CurrentUser() actor: AuthUser, @Body() dto: AssignRoleDto) {
    return this.rbac.unassign(actor, dto.userId, dto.roleName);
  }

  @Post('catalogue')
  @ApiOperation({
    summary: 'Add or update the role/permission catalogue',
    description: [
      'Insert/update roles, permissions, role_permissions. Does not remove existing grants or seeded roles.',
      'Permission: role.catalogue.write (platform_admin).',
    ].join('\n'),
  })
  catalogue(@CurrentUser() actor: AuthUser, @Body() dto: CatalogueDto) {
    return this.rbac.catalogue(actor, {
      roleName: dto.roleName,
      roleDescription: dto.roleDescription,
      permissionCode: dto.permissionCode,
      permissionDescription: dto.permissionDescription,
      grantRoleName: dto.grantRoleName,
      grantPermissionCode: dto.grantPermissionCode,
    });
  }
}
