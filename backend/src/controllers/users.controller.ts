import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiProperty,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { AuthGuard } from '../guards/auth.guard';
import { AuthUser, CurrentUser } from '../helpers/auth-user';
import { optionalText } from '../helpers/values';
import { UsersService } from '../services/users.service';

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
  constructor(private readonly users: UsersService) {}

  @Get('me')
  @ApiOperation({
    summary: 'Current profile + roles',
    description:
      'users + user_roles + permission codes (union of role_permissions).\nPermission: user.read.self (all roles).',
  })
  me(@CurrentUser() actor: AuthUser) {
    return this.users.readOwnProfile(actor);
  }

  @Patch('me')
  @ApiOperation({
    summary: 'Update own profile',
    description: 'Update users.full_name.\nPermission: user.update.self (all roles).',
  })
  updateMe(@CurrentUser() actor: AuthUser, @Body() dto: UpdateUserDto) {
    return this.users.updateOwnProfile(actor, dto.fullName);
  }

  @Get()
  @ApiQuery({ name: 'organizationId', required: false, description: 'Filter by users.organization_id' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role_name (join user_roles)' })
  @ApiQuery({ name: 'search', required: false, description: 'Match email or full_name' })
  @ApiQuery({ name: 'status', required: false, enum: ['active', 'deactivated'] })
  @ApiOperation({
    summary: 'List users',
    description:
      'Select users, filter by organizationId / role / search / status. Org-scoped callers are limited to their organisation.\nPermission: user.read.org or user.read.all.',
  })
  list(
    @CurrentUser() actor: AuthUser,
    @Query('organizationId') organizationId?: string,
    @Query('role') role?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
  ) {
    return this.users.list(actor, {
      organizationId: optionalText(organizationId),
      role: optionalText(role),
      search: optionalText(search),
      status: optionalText(status),
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user by id',
    description:
      'Select users + roles.\nPermission: user.read.org (same org) or user.read.all or user.read.self.',
  })
  getOne(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.users.getOne(actor, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a user in the organisation',
    description: 'Update users.full_name.\nPermission: user.update.org (org_admin).',
  })
  update(
    @CurrentUser() actor: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users.update(actor, id, dto.fullName);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Deactivate a user',
    description:
      'Set user_status_id to deactivated. Never hard-delete a user.\nPermission: user.deactivate (org_admin).',
  })
  deactivate(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.users.setStatus(actor, id, 'deactivated');
  }

  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Activate a deactivated user',
    description:
      'Set user_status_id back to active.\nPermission: user.deactivate (org_admin).',
  })
  activate(@CurrentUser() actor: AuthUser, @Param('id') id: string) {
    return this.users.setStatus(actor, id, 'active');
  }
}
