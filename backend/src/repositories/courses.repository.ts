import { Injectable } from '@nestjs/common';
import {
  isUuid,
  SqlParameter,
  textFromDatabase,
  whereClause,
} from '../helpers/values';
import { PostgresService } from '../services/postgres.service';

type CourseRow = {
  id: string;
  owning_organization_id: string | null;
  title: string;
  description: string | null;
  visibility: string;
  status: string;
  created_by: string;
  created_at: Date;
  updated_at: Date;
};

export type PublicCourse = {
  id: string;
  organizationId: string | undefined;
  title: string;
  description: string | undefined;
  visibility: string;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CourseAccess = {
  includeCommunity: boolean;
  privateOrganizationId: string | undefined;
  enrolledUserId: string | undefined;
};

export type CourseListFilters = {
  organizationId: string | undefined;
  visibility: string | undefined;
  search: string | undefined;
  status: string | undefined;
};

const courseSelectSql = `SELECT
  c.id,
  c.owning_organization_id,
  c.title,
  c.description,
  cv.visibility_code AS visibility,
  cs.status_code AS status,
  c.created_by,
  c.created_at,
  c.updated_at
FROM courses c
JOIN course_visibilities cv ON cv.course_visibility_id = c.course_visibility_id
JOIN course_statuses cs ON cs.course_status_id = c.course_status_id`;

function toPublicCourse(row: CourseRow): PublicCourse {
  return {
    id: row.id,
    organizationId: textFromDatabase(row.owning_organization_id),
    title: row.title,
    description: textFromDatabase(row.description),
    visibility: row.visibility,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function accessSql(access: CourseAccess, values: SqlParameter[]): string {
  const parts: string[] = [];
  if (access.includeCommunity) {
    parts.push(`cv.visibility_code = 'community'`);
  }
  if (access.privateOrganizationId !== undefined) {
    values.push(access.privateOrganizationId);
    parts.push(
      `(cv.visibility_code = 'private' AND c.owning_organization_id = $${values.length})`,
    );
  }
  if (access.enrolledUserId !== undefined) {
    values.push(access.enrolledUserId);
    parts.push(`EXISTS (
      SELECT 1
      FROM enrollments e
      JOIN enrollment_statuses es ON es.enrollment_status_id = e.enrollment_status_id
      WHERE e.course_id = c.id
        AND e.user_id = $${values.length}
        AND es.status_code = 'active'
    )`);
  }
  if (parts.length === 0) {
    return 'false';
  }
  return `(${parts.join(' OR ')})`;
}

@Injectable()
export class CoursesRepository {
  constructor(private readonly postgres: PostgresService) {}

  async findById(courseId: string): Promise<PublicCourse | undefined> {
    if (isUuid(courseId) === false) {
      return undefined;
    }
    const result = await this.postgres.query<CourseRow>(
      `${courseSelectSql} WHERE c.id = $1`,
      [courseId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicCourse(row);
  }

  async isVisible(
    courseId: string,
    access: CourseAccess,
  ): Promise<boolean> {
    const values: SqlParameter[] = [];
    const accessClause = accessSql(access, values);
    values.push(courseId);
    const result = await this.postgres.query<{ id: string }>(
      `${courseSelectSql} WHERE ${accessClause} AND c.id = $${values.length}`,
      values,
    );
    return result.rows[0] !== undefined;
  }

  async list(
    filters: CourseListFilters,
    access: CourseAccess,
  ): Promise<PublicCourse[]> {
    const values: SqlParameter[] = [];
    const conditions: string[] = [accessSql(access, values)];
    if (filters.organizationId !== undefined) {
      values.push(filters.organizationId);
      conditions.push(`c.owning_organization_id = $${values.length}`);
    }
    if (filters.visibility !== undefined) {
      values.push(filters.visibility);
      conditions.push(`cv.visibility_code = $${values.length}`);
    }
    if (filters.status !== undefined) {
      values.push(filters.status);
      conditions.push(`cs.status_code = $${values.length}`);
    } else {
      conditions.push(`cs.status_code = 'active'`);
    }
    if (filters.search !== undefined) {
      values.push(`%${filters.search}%`);
      conditions.push(
        `(c.title ILIKE $${values.length} OR coalesce(c.description, '') ILIKE $${values.length})`,
      );
    }
    const result = await this.postgres.query<CourseRow>(
      `${courseSelectSql}
       ${whereClause(conditions)}
       ORDER BY c.updated_at DESC`,
      values,
    );
    return result.rows.map(toPublicCourse);
  }

  async insert(input: {
    organizationId: string | undefined;
    title: string;
    description: string | undefined;
    visibility: 'private' | 'community';
    createdBy: string;
  }): Promise<string | undefined> {
    const inserted = await this.postgres.query<{ id: string }>(
      `INSERT INTO courses (
         owning_organization_id, title, description, course_visibility_id, created_by
       )
       SELECT $1, $2, $3, cv.course_visibility_id, $4
       FROM course_visibilities cv
       WHERE cv.visibility_code = $5
       RETURNING id`,
      [
        input.organizationId === undefined ? null : input.organizationId,
        input.title,
        input.description,
        input.createdBy,
        input.visibility,
      ],
    );
    const row = inserted.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return row.id;
  }

  async updateTitle(courseId: string, title: string) {
    await this.postgres.query(
      'UPDATE courses SET title = $2, updated_at = now() WHERE id = $1',
      [courseId, title],
    );
  }

  async updateDescription(courseId: string, description: string) {
    await this.postgres.query(
      'UPDATE courses SET description = $2, updated_at = now() WHERE id = $1',
      [courseId, description],
    );
  }

  async setVisibility(courseId: string, visibility: 'private' | 'community') {
    await this.postgres.query(
      `UPDATE courses
       SET course_visibility_id = cv.course_visibility_id,
           updated_at = now()
       FROM course_visibilities cv
       WHERE courses.id = $1 AND cv.visibility_code = $2`,
      [courseId, visibility],
    );
  }

  async setStatus(courseId: string, statusCode: 'active' | 'deactivated') {
    await this.postgres.query(
      `UPDATE courses
       SET course_status_id = cs.course_status_id,
           updated_at = now()
       FROM course_statuses cs
       WHERE courses.id = $1 AND cs.status_code = $2`,
      [courseId, statusCode],
    );
  }

  async touch(courseId: string) {
    await this.postgres.query(
      'UPDATE courses SET updated_at = now() WHERE id = $1',
      [courseId],
    );
  }
}
