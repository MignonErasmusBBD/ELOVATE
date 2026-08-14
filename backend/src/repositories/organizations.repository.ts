import { Injectable } from '@nestjs/common';
import {
  isUuid,
  SqlParameter,
  whereClause,
} from '../helpers/values';
import { PostgresService } from '../services/postgres.service';

type OrganizationRow = {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: Date;
};

export type PublicOrganization = {
  id: string;
  name: string;
  slug: string;
  status: string;
  createdAt: Date;
};

export type OrganizationListFilters = {
  search: string | undefined;
  status: string | undefined;
};

const organizationSelectSql = `SELECT
  o.id,
  o.name,
  o.slug,
  os.status_code AS status,
  o.created_at
FROM organizations o
JOIN organization_statuses os ON os.organization_status_id = o.organization_status_id`;

function toPublicOrganization(row: OrganizationRow): PublicOrganization {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    createdAt: row.created_at,
  };
}

@Injectable()
export class OrganizationsRepository {
  constructor(private readonly postgres: PostgresService) {}

  async findById(organizationId: string): Promise<PublicOrganization | undefined> {
    if (isUuid(organizationId) === false) {
      return undefined;
    }
    const result = await this.postgres.query<OrganizationRow>(
      `${organizationSelectSql} WHERE o.id = $1`,
      [organizationId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicOrganization(row);
  }

  async findIdBySlug(slug: string): Promise<string | undefined> {
    const result = await this.postgres.query<{ id: string }>(
      'SELECT id FROM organizations WHERE slug = $1',
      [slug],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return row.id;
  }

  async list(filters: OrganizationListFilters): Promise<PublicOrganization[]> {
    const values: SqlParameter[] = [];
    const conditions: string[] = [];
    if (filters.search !== undefined) {
      values.push(`%${filters.search}%`);
      conditions.push(
        `(o.name ILIKE $${values.length} OR o.slug ILIKE $${values.length})`,
      );
    }
    if (filters.status !== undefined) {
      values.push(filters.status);
      conditions.push(`os.status_code = $${values.length}`);
    }
    const result = await this.postgres.query<OrganizationRow>(
      `${organizationSelectSql}
       ${whereClause(conditions)}
       ORDER BY o.created_at DESC`,
      values,
    );
    return result.rows.map(toPublicOrganization);
  }

  async insert(name: string, slug: string): Promise<string> {
    const inserted = await this.postgres.query<{ id: string }>(
      `INSERT INTO organizations (name, slug)
       VALUES ($1, $2)
       RETURNING id`,
      [name, slug],
    );
    const row = inserted.rows[0];
    if (row === undefined) {
      throw new Error('Organisation insert returned no row');
    }
    return row.id;
  }

  async updateName(organizationId: string, name: string) {
    await this.postgres.query(
      'UPDATE organizations SET name = $1 WHERE id = $2',
      [name, organizationId],
    );
  }

  async setStatus(
    organizationId: string,
    statusCode: 'active' | 'suspended',
  ) {
    await this.postgres.query(
      `UPDATE organizations
       SET organization_status_id = os.organization_status_id
       FROM organization_statuses os
       WHERE organizations.id = $1 AND os.status_code = $2`,
      [organizationId, statusCode],
    );
  }
}
