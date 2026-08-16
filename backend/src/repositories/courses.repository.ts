import { Injectable } from '@nestjs/common';
import {
  booleanFromDatabase,
  dateFromDatabase,
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
  quiz_question_count: number;
  section_count: number;
  active_question_count: number;
  is_enrolled: boolean | null;
  enrollment_is_required: boolean | null;
  enrollment_due_at: Date | null;
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
  quizQuestionCount: number;
  sectionCount: number;
  activeQuestionCount: number;
  isEnrolled: boolean | undefined;
  isRequired: boolean | undefined;
  dueAt: Date | undefined;
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
  learnerCatalogue?: boolean;
};

const courseFromSql = `FROM courses c
JOIN course_visibilities cv ON cv.course_visibility_id = c.course_visibility_id
JOIN course_statuses cs ON cs.course_status_id = c.course_status_id`;

const courseCountJoinsSql = `LEFT JOIN (
  SELECT course_id, count(*)::int AS section_count
  FROM course_sections
  GROUP BY course_id
) sc ON sc.course_id = c.id
LEFT JOIN (
  SELECT question_section.course_id, count(*)::int AS active_question_count
  FROM questions question_count
  JOIN course_sections question_section
    ON question_section.id = question_count.course_section_id
  JOIN question_statuses question_status
    ON question_status.question_status_id = question_count.question_status_id
  WHERE question_status.status_code = 'active'
  GROUP BY question_section.course_id
) aq ON aq.course_id = c.id`;

function courseSelectSql(enrolledParamIndex: number | undefined): string {
  const enrollmentSelect =
    enrolledParamIndex === undefined
      ? `NULL::boolean AS is_enrolled,
  NULL::boolean AS enrollment_is_required,
  NULL::timestamptz AS enrollment_due_at`
      : `(my_enr.is_required IS NOT NULL) AS is_enrolled,
  my_enr.is_required AS enrollment_is_required,
  my_enr.due_at AS enrollment_due_at`;
  const enrollmentJoin =
    enrolledParamIndex === undefined
      ? ''
      : `LEFT JOIN LATERAL (
  SELECT e.is_required, e.due_at
  FROM enrollments e
  JOIN enrollment_statuses es
    ON es.enrollment_status_id = e.enrollment_status_id
  WHERE e.course_id = c.id
    AND e.user_id = $${enrolledParamIndex}
    AND es.status_code = 'active'
  ORDER BY e.enrolled_at DESC
  LIMIT 1
) my_enr ON true`;

  return `SELECT
  c.id,
  c.owning_organization_id,
  c.title,
  c.description,
  cv.visibility_code AS visibility,
  cs.status_code AS status,
  c.quiz_question_count,
  coalesce(sc.section_count, 0)::int AS section_count,
  coalesce(aq.active_question_count, 0)::int AS active_question_count,
  ${enrollmentSelect},
  c.created_by,
  c.created_at,
  c.updated_at
${courseFromSql}
${courseCountJoinsSql}
${enrollmentJoin}`;
}

function toPublicCourse(row: CourseRow): PublicCourse {
  return {
    id: row.id,
    organizationId: textFromDatabase(row.owning_organization_id),
    title: row.title,
    description: textFromDatabase(row.description),
    visibility: row.visibility,
    status: row.status,
    quizQuestionCount: row.quiz_question_count,
    sectionCount: row.section_count,
    activeQuestionCount: row.active_question_count,
    isEnrolled: booleanFromDatabase(row.is_enrolled),
    isRequired: booleanFromDatabase(row.enrollment_is_required),
    dueAt: dateFromDatabase(row.enrollment_due_at),
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function accessSql(
  access: CourseAccess,
  values: SqlParameter[],
): { clause: string; enrolledParamIndex: number | undefined } {
  const parts: string[] = [];
  let enrolledParamIndex: number | undefined;
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
    enrolledParamIndex = values.length;
    parts.push(`EXISTS (
      SELECT 1
      FROM enrollments e
      JOIN enrollment_statuses es ON es.enrollment_status_id = e.enrollment_status_id
      WHERE e.course_id = c.id
        AND e.user_id = $${enrolledParamIndex}
        AND es.status_code = 'active'
    )`);
  }
  if (parts.length === 0) {
    return { clause: 'false', enrolledParamIndex };
  }
  return { clause: `(${parts.join(' OR ')})`, enrolledParamIndex };
}

function appendSharedListFilters(
  filters: CourseListFilters,
  values: SqlParameter[],
  conditions: string[],
) {
  if (filters.organizationId !== undefined) {
    values.push(filters.organizationId);
    conditions.push(`c.owning_organization_id = $${values.length}`);
  }
  if (filters.visibility !== undefined) {
    values.push(filters.visibility);
    conditions.push(`cv.visibility_code = $${values.length}`);
  }
  if (filters.search !== undefined) {
    values.push(`%${filters.search}%`);
    conditions.push(
      `(c.title ILIKE $${values.length} OR coalesce(c.description, '') ILIKE $${values.length})`,
    );
  }
}

@Injectable()
export class CoursesRepository {
  constructor(private readonly postgres: PostgresService) {}

  async findById(courseId: string): Promise<PublicCourse | undefined> {
    if (isUuid(courseId) === false) {
      return undefined;
    }
    const result = await this.postgres.query<CourseRow>(
      `${courseSelectSql(undefined)} WHERE c.id = $1`,
      [courseId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicCourse(row);
  }

  async isVisible(courseId: string, access: CourseAccess): Promise<boolean> {
    const values: SqlParameter[] = [];
    const accessResult = accessSql(access, values);
    values.push(courseId);
    const result = await this.postgres.query<{ id: string }>(
      `SELECT c.id
       ${courseFromSql}
       WHERE ${accessResult.clause} AND c.id = $${values.length}
       LIMIT 1`,
      values,
    );
    return result.rows[0] !== undefined;
  }

  async list(
    filters: CourseListFilters,
    access: CourseAccess,
  ): Promise<PublicCourse[]> {
    const values: SqlParameter[] = [];
    const accessResult = accessSql(access, values);
    const conditions: string[] = [];

    if (filters.learnerCatalogue === true) {
      if (accessResult.enrolledParamIndex === undefined) {
        conditions.push(
          `${accessResult.clause} AND cs.status_code = 'active'`,
        );
      } else {
        conditions.push(`(
          (${accessResult.clause} AND cs.status_code = 'active')
          OR (
            cs.status_code = 'deactivated'
            AND EXISTS (
              SELECT 1
              FROM enrollments e
              JOIN enrollment_statuses es
                ON es.enrollment_status_id = e.enrollment_status_id
              WHERE e.course_id = c.id
                AND e.user_id = $${accessResult.enrolledParamIndex}
                AND es.status_code = 'active'
            )
          )
        )`);
      }
    } else {
      conditions.push(accessResult.clause);
      if (filters.status !== undefined && filters.status !== 'all') {
        values.push(filters.status);
        conditions.push(`cs.status_code = $${values.length}`);
      } else if (filters.status !== 'all') {
        conditions.push(`cs.status_code = 'active'`);
      }
    }

    appendSharedListFilters(filters, values, conditions);

    const result = await this.postgres.query<CourseRow>(
      `${courseSelectSql(accessResult.enrolledParamIndex)}
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
         owning_organization_id,
         title,
         description,
         course_visibility_id,
         course_status_id,
         created_by
       )
       SELECT
         $1,
         $2,
         $3,
         cv.course_visibility_id,
         cs.course_status_id,
         $4
       FROM course_visibilities cv
       CROSS JOIN course_statuses cs
       WHERE cv.visibility_code = $5
         AND cs.status_code = 'draft'
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

  async setStatus(
    courseId: string,
    statusCode: 'active' | 'deactivated' | 'draft',
  ) {
    await this.postgres.query(
      `UPDATE courses
       SET course_status_id = cs.course_status_id,
           updated_at = now()
       FROM course_statuses cs
       WHERE courses.id = $1 AND cs.status_code = $2`,
      [courseId, statusCode],
    );
  }

  async updateQuizQuestionCount(courseId: string, count: number) {
    await this.postgres.query(
      'UPDATE courses SET quiz_question_count = $2, updated_at = now() WHERE id = $1',
      [courseId, count],
    );
  }

  async touch(courseId: string) {
    await this.postgres.query(
      'UPDATE courses SET updated_at = now() WHERE id = $1',
      [courseId],
    );
  }
}
