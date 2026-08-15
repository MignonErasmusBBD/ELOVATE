import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { hasPermission, requirePermission } from '../helpers/require-permission';
import { slugFromName } from '../helpers/slug';
import {
  OrganizationsRepository,
  PublicOrganization,
} from '../repositories/organizations.repository';
import { RbacRepository } from '../repositories/rbac.repository';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class OrganizationsService {
  constructor(
    private readonly organizations: OrganizationsRepository,
    private readonly users: UsersRepository,
    private readonly rbac: RbacRepository,
  ) {}

  async create(
    actor: AuthUser,
    name: string,
    slug: string | undefined,
    adminUserIds: string[] | undefined,
  ) {
    requirePermission(actor, ['org.create']);
    const resolvedSlug = await this.resolveSlug(name, slug);
    const adminIds: string[] = [];
    for (const userId of adminUserIds ?? []) {
      if (adminIds.includes(userId) === false) {
        adminIds.push(userId);
      }
    }
    for (const userId of adminIds) {
      await this.requireUserAvailableForOrganisation(userId);
    }

    const organizationId = await this.organizations.insert(
      name.trim(),
      resolvedSlug,
    );
    for (const userId of adminIds) {
      await this.placeAdminInOrganisation(organizationId, userId);
    }
    return this.requireOrganization(organizationId);
  }

  async addMember(actor: AuthUser, organizationId: string, userId: string) {
    requirePermission(actor, ['org.create']);
    await this.requireOrganization(organizationId);
    await this.placeAdminInOrganisation(organizationId, userId);
    return this.users.findById(userId);
  }

  async removeMember(actor: AuthUser, organizationId: string, userId: string) {
    requirePermission(actor, ['org.create']);
    await this.requireOrganization(organizationId);
    const user = await this.users.findById(userId);
    if (user === undefined) {
      throw new NotFoundException('User not found');
    }
    if (user.organizationId !== organizationId) {
      throw new BadRequestException(
        'User is not a member of that organisation',
      );
    }
    await this.users.clearOrganizationId(userId);
    await this.rbac.deleteAssignment(userId, 'org_admin');
    return this.users.findById(userId);
  }

  async list(
    actor: AuthUser,
    filters: { search: string | undefined; status: string | undefined },
  ) {
    requirePermission(actor, ['org.read.all']);
    const items = await this.organizations.list(filters);
    return { items };
  }

  async getOne(actor: AuthUser, organizationId: string) {
    const organization = await this.requireOrganization(organizationId);
    const isOwn = organization.id === actor.organizationId;
    const canRead =
      (isOwn && hasPermission(actor, ['org.read.self'])) ||
      hasPermission(actor, ['org.read.all']);
    if (canRead === false) {
      throw new ForbiddenException(
        'Missing permission: org.read.self or org.read.all',
      );
    }
    return organization;
  }

  async update(
    actor: AuthUser,
    organizationId: string,
    name: string | undefined,
  ) {
    requirePermission(actor, ['org.update.self']);
    const organization = await this.requireOrganization(organizationId);
    if (organization.id !== actor.organizationId) {
      throw new ForbiddenException(
        'Can only update your own organisation',
      );
    }
    if (name === undefined) {
      return organization;
    }
    await this.organizations.updateName(organizationId, name);
    return this.requireOrganization(organizationId);
  }

  async setStatus(
    actor: AuthUser,
    organizationId: string,
    statusCode: 'active' | 'suspended',
  ) {
    requirePermission(actor, ['org.suspend']);
    await this.requireOrganization(organizationId);
    await this.organizations.setStatus(organizationId, statusCode);
    return this.requireOrganization(organizationId);
  }

  private async requireOrganization(
    organizationId: string,
  ): Promise<PublicOrganization> {
    const organization = await this.organizations.findById(organizationId);
    if (organization === undefined) {
      throw new NotFoundException('Organisation not found');
    }
    return organization;
  }

  private async resolveSlug(
    name: string,
    slug: string | undefined,
  ): Promise<string> {
    if (slug !== undefined && slug !== '') {
      const existingId = await this.organizations.findIdBySlug(slug);
      if (existingId !== undefined) {
        throw new ConflictException('Organisation slug already exists');
      }
      return slug;
    }

    const baseSlug = slugFromName(name);
    const existingBase = await this.organizations.findIdBySlug(baseSlug);
    if (existingBase === undefined) {
      return baseSlug;
    }

    let suffix = 2;
    while (suffix < 1000) {
      const candidate = `${baseSlug}-${suffix}`;
      const taken = await this.organizations.findIdBySlug(candidate);
      if (taken === undefined) {
        return candidate;
      }
      suffix += 1;
    }
    throw new ConflictException('Could not generate a unique organisation slug');
  }

  private async requireUserAvailableForOrganisation(userId: string) {
    const user = await this.users.findById(userId);
    if (user === undefined) {
      throw new NotFoundException('User not found');
    }
    if (user.organizationId !== undefined) {
      throw new BadRequestException(
        'User already belongs to an organisation',
      );
    }
    return user;
  }

  private async placeAdminInOrganisation(
    organizationId: string,
    userId: string,
  ) {
    await this.requireUserAvailableForOrganisation(userId);
    await this.users.setOrganizationId(userId, organizationId);
    await this.rbac.insertAssignment(userId, 'org_admin');
  }
}
