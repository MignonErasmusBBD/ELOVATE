import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { hasPermission, requirePermission } from '../helpers/require-permission';
import { isUuid } from '../helpers/values';
import {
  CatalogueInput,
  RbacCatalogueRepository,
} from '../repositories/rbac-catalogue.repository';
import { PublicRole, RbacRepository } from '../repositories/rbac.repository';
import { UsersRepository } from '../repositories/users.repository';

export type { CatalogueInput };

@Injectable()
export class RbacService {
  constructor(
    private readonly rbac: RbacRepository,
    private readonly catalogueRepository: RbacCatalogueRepository,
    private readonly users: UsersRepository,
  ) {}

  async listRoles(actor: AuthUser, filters: { name: string | undefined }) {
    requirePermission(actor, ['role.read']);
    const items = await this.rbac.listRoles(filters.name);
    return { items };
  }

  async getRole(actor: AuthUser, roleName: string) {
    requirePermission(actor, ['role.read']);
    const role = await this.requireRole(roleName);
    const permissions = await this.rbac.listPermissionsForRole(role.roleId);
    return { ...role, permissions };
  }

  async listPermissions(actor: AuthUser, search: string | undefined) {
    requirePermission(actor, ['role.read']);
    const items = await this.rbac.listPermissions(search);
    return { items };
  }

  async listAssignments(
    actor: AuthUser,
    filters: {
      userId: string | undefined;
      organizationId: string | undefined;
      role: string | undefined;
    },
  ) {
    requirePermission(actor, ['role.read']);
    let organizationId = filters.organizationId;
    if (hasPermission(actor, ['user.read.all']) === false) {
      if (
        organizationId !== undefined &&
        organizationId !== actor.organizationId
      ) {
        throw new ForbiddenException(
          'Can only list role grants in your own organisation',
        );
      }
      organizationId = actor.organizationId;
    }
    if (filters.userId !== undefined && isUuid(filters.userId) === false) {
      return { items: [] };
    }
    const items = await this.rbac.listAssignments({
      userId: filters.userId,
      organizationId,
      role: filters.role,
    });
    return { items };
  }

  async assign(actor: AuthUser, userId: string, roleName: string) {
    requirePermission(actor, ['role.assign']);
    if (roleName === 'learner') {
      throw new BadRequestException(
        'learner is granted at signup; use this endpoint for extra roles only',
      );
    }
    await this.prepareGrantChange(actor, userId, roleName);
    const inserted = await this.rbac.insertAssignment(userId, roleName);
    if (inserted === false) {
      throw new ConflictException('User already has that role');
    }
    return { userId, roleName };
  }

  async unassign(actor: AuthUser, userId: string, roleName: string) {
    requirePermission(actor, ['role.remove']);
    if (roleName === 'learner') {
      throw new BadRequestException('Never unassign learner');
    }
    await this.prepareGrantChange(actor, userId, roleName);
    const deleted = await this.rbac.deleteAssignment(userId, roleName);
    if (deleted === false) {
      throw new NotFoundException('Role grant not found');
    }
    return { userId, roleName, removed: true };
  }

  async catalogue(actor: AuthUser, input: CatalogueInput) {
    requirePermission(actor, ['role.catalogue.write']);
    const hasRole = input.roleName !== undefined;
    const hasPermissionWrite = input.permissionCode !== undefined;
    const hasGrant =
      input.grantRoleName !== undefined &&
      input.grantPermissionCode !== undefined;
    if (hasRole === false && hasPermissionWrite === false && hasGrant === false) {
      throw new BadRequestException(
        'Provide a role, a permission, and/or a grant to add or update',
      );
    }
    return this.catalogueRepository.writeCatalogue(input);
  }

  private async prepareGrantChange(
    actor: AuthUser,
    userId: string,
    roleName: string,
  ): Promise<PublicRole> {
    const role = await this.requireRole(roleName);
    const user = await this.users.findById(userId);
    if (user === undefined) {
      throw new NotFoundException('User not found');
    }
    if (hasPermission(actor, ['user.read.all']) === false) {
      if (user.organizationId !== actor.organizationId) {
        throw new ForbiddenException(
          'Can only change role grants for users in your own organisation',
        );
      }
      if (roleName !== 'org_admin' && roleName !== 'educator') {
        throw new ForbiddenException(
          'Can only assign or remove org_admin and educator in your organisation',
        );
      }
    }
    return role;
  }

  private async requireRole(roleName: string): Promise<PublicRole> {
    const role = await this.rbac.findRoleByName(roleName);
    if (role === undefined) {
      throw new NotFoundException(`Role not found: ${roleName}`);
    }
    return role;
  }
}
