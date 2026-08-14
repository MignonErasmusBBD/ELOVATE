import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '../helpers/auth-user';
import { hasPermission, requirePermission } from '../helpers/require-permission';
import {
  OrganizationsRepository,
  PublicOrganization,
} from '../repositories/organizations.repository';

@Injectable()
export class OrganizationsService {
  constructor(private readonly organizations: OrganizationsRepository) {}

  async create(actor: AuthUser, name: string, slug: string) {
    requirePermission(actor, ['org.create']);
    const existingId = await this.organizations.findIdBySlug(slug);
    if (existingId !== undefined) {
      throw new ConflictException('Organisation slug already exists');
    }
    const organizationId = await this.organizations.insert(name, slug);
    return this.requireOrganization(organizationId);
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
}
