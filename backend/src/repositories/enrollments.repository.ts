import { Injectable } from '@nestjs/common';
import {
  dateFromDatabase,
  isUuid,
  SqlParameter,
  textFromDatabase,
  whereClause,
} from '../helpers/values';
import { PostgresService } from '../services/postgres.service';

type EnrollmentRow = {
  id: string;
  user_id: string;
  course_id: string;
  organization_id: string | null;
  enrolled_at: Date;
  is_required: boolean;
  due_at: Date | null;
  status: string;
  full_name: string | null;
  email: string;
  course_title: string;
};

export type PublicEnrollment = {
  id: string;
  userId: string;
  courseId: string;
  organizationId: string | undefined;
  enrolledAt: Date;
  isRequired: boolean;
  dueAt: Date | undefined;
  status: string;
  userFullName: string;
  emailAddress: string;
  courseTitle: string;
};

export type EnrollmentListFilters = {
  organizationId: string | undefined;
  courseId: string | undefined;
  userId: string | undefined;
  status: string | undefined;
};

const enrollmentSelectSql = `SELECT
  e.id,
  e.user_id,
  e.course_id,
  u.organization_id,
  e.enrolled_at,
  e.is_required,
  e.due_at,
  es.status_code AS status,
  u.full_name,
  u.email,
  c.title AS course_title
FROM enrollments e
JOIN users u ON u.id = e.user_id
JOIN courses c ON c.id = e.course_id
JOIN enrollment_statuses es ON es.enrollment_status_id = e.enrollment_status_id`;

function toPublicEnrollment(row: EnrollmentRow): PublicEnrollment {
  const fullName = textFromDatabase(row.full_name);
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    organizationId: textFromDatabase(row.organization_id),
    enrolledAt: row.enrolled_at,
    isRequired: row.is_required,
    dueAt: dateFromDatabase(row.due_at),
    status: row.status,
    userFullName: fullName === undefined ? row.email : fullName,
    emailAddress: row.email,
    courseTitle: row.course_title,
  };
}

@Injectable()
export class EnrollmentsRepository {
  constructor(private readonly postgres: PostgresService) {}

  async findById(enrollmentId: string): Promise<PublicEnrollment | undefined> {
    if (isUuid(enrollmentId) === false) {
      return undefined;
    }
    const result = await this.postgres.query<EnrollmentRow>(
      `${enrollmentSelectSql} WHERE e.id = $1`,
      [enrollmentId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicEnrollment(row);
  }

  async findByUserAndCourse(
    userId: string,
    courseId: string,
  ): Promise<PublicEnrollment | undefined> {
    const result = await this.postgres.query<EnrollmentRow>(
      `${enrollmentSelectSql} WHERE e.user_id = $1 AND e.course_id = $2
       ORDER BY e.enrolled_at DESC
       LIMIT 1`,
      [userId, courseId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicEnrollment(row);
  }

  async list(filters: EnrollmentListFilters): Promise<PublicEnrollment[]> {
    const values: SqlParameter[] = [];
    const conditions: string[] = [];
    if (filters.organizationId !== undefined) {
      values.push(filters.organizationId);
      conditions.push(`u.organization_id = $${values.length}`);
    }
    if (filters.courseId !== undefined) {
      values.push(filters.courseId);
      conditions.push(`e.course_id = $${values.length}`);
    }
    if (filters.userId !== undefined) {
      values.push(filters.userId);
      conditions.push(`e.user_id = $${values.length}`);
    }
    if (filters.status !== undefined) {
      values.push(filters.status);
      conditions.push(`es.status_code = $${values.length}`);
    }
    const result = await this.postgres.query<EnrollmentRow>(
      `${enrollmentSelectSql}
       ${whereClause(conditions)}
       ORDER BY e.enrolled_at DESC`,
      values,
    );
    return result.rows.map(toPublicEnrollment);
  }

  async insert(
    userId: string,
    courseId: string,
    requirement: { isRequired: boolean; dueAt: Date | undefined },
  ): Promise<string> {
    const inserted = await this.postgres.query<{ id: string }>(
      `INSERT INTO enrollments (user_id, course_id, enrollment_status_id, is_required, due_at)
       SELECT $1, $2, es.enrollment_status_id, $3, $4
       FROM enrollment_statuses es
       WHERE es.status_code = 'active'
       RETURNING id`,
      [
        userId,
        courseId,
        requirement.isRequired,
        requirement.dueAt === undefined ? null : requirement.dueAt.toISOString(),
      ],
    );
    const row = inserted.rows[0];
    if (row === undefined) {
      throw new Error('Enrollment insert returned no row');
    }
    return row.id;
  }

  async setStatus(
    enrollmentId: string,
    statusCode: 'active' | 'completed' | 'withdrawn',
  ) {
    await this.postgres.query(
      `UPDATE enrollments
       SET enrollment_status_id = es.enrollment_status_id
       FROM enrollment_statuses es
       WHERE enrollments.id = $1 AND es.status_code = $2`,
      [enrollmentId, statusCode],
    );
  }

  async setRequirement(
    enrollmentId: string,
    requirement: { isRequired: boolean; dueAt: Date | undefined },
  ) {
    await this.postgres.query(
      `UPDATE enrollments
       SET is_required = $2,
           due_at = $3
       WHERE id = $1`,
      [
        enrollmentId,
        requirement.isRequired,
        requirement.dueAt === undefined ? null : requirement.dueAt.toISOString(),
      ],
    );
  }

  async hasActiveEnrollment(userId: string, courseId: string): Promise<boolean> {
    const result = await this.postgres.query<{ id: string }>(
      `SELECT e.id
       FROM enrollments e
       JOIN enrollment_statuses es ON es.enrollment_status_id = e.enrollment_status_id
       WHERE e.user_id = $1 AND e.course_id = $2 AND es.status_code = 'active'
       LIMIT 1`,
      [userId, courseId],
    );
    return result.rows[0] !== undefined;
  }
}
