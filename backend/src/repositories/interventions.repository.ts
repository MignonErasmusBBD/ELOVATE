import { Injectable } from '@nestjs/common';
import {
  dateFromDatabase,
  isUuid,
  SqlParameter,
  whereClause,
} from '../helpers/values';
import { PostgresService } from '../services/postgres.service';

type FlagRow = {
  id: string;
  user_id: string;
  course_id: string;
  organization_id: string;
  rule_id: string;
  rule_name: string;
  trigger_code: string;
  triggered_at: Date;
  status: string;
  resolved_by: string | null;
  resolved_at: Date | null;
};

export type PublicFlag = {
  id: string;
  userId: string;
  courseId: string;
  organizationId: string;
  ruleId: string;
  ruleName: string;
  triggerCode: string;
  triggeredAt: Date;
  status: string;
  resolvedBy: string | undefined;
  resolvedAt: Date | undefined;
};

export type FlagListFilters = {
  organizationId: string | undefined;
  courseId: string | undefined;
  userId: string | undefined;
  status: string | undefined;
};

const flagSelectSql = `SELECT
  f.id,
  f.user_id,
  f.course_id,
  u.organization_id,
  f.rule_id,
  r.rule_name,
  t.trigger_code,
  f.triggered_at,
  s.status_code AS status,
  f.resolved_by,
  f.resolved_at
FROM intervention_flags f
JOIN users u ON u.id = f.user_id
JOIN intervention_rules r ON r.id = f.rule_id
JOIN intervention_trigger_types t ON t.intervention_trigger_type_id = r.intervention_trigger_type_id
JOIN intervention_flag_statuses s ON s.intervention_flag_status_id = f.intervention_flag_status_id`;

function toPublicFlag(row: FlagRow): PublicFlag {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    organizationId: row.organization_id,
    ruleId: row.rule_id,
    ruleName: row.rule_name,
    triggerCode: row.trigger_code,
    triggeredAt: row.triggered_at,
    status: row.status,
    resolvedBy: row.resolved_by === null ? undefined : row.resolved_by,
    resolvedAt: dateFromDatabase(row.resolved_at),
  };
}

@Injectable()
export class InterventionsRepository {
  constructor(private readonly postgres: PostgresService) {}

  async list(filters: FlagListFilters): Promise<PublicFlag[]> {
    const values: SqlParameter[] = [];
    const conditions: string[] = [];
    if (filters.organizationId !== undefined) {
      values.push(filters.organizationId);
      conditions.push(`u.organization_id = $${values.length}`);
    }
    if (filters.courseId !== undefined) {
      values.push(filters.courseId);
      conditions.push(`f.course_id = $${values.length}`);
    }
    if (filters.userId !== undefined) {
      values.push(filters.userId);
      conditions.push(`f.user_id = $${values.length}`);
    }
    if (filters.status !== undefined) {
      values.push(filters.status);
      conditions.push(`s.status_code = $${values.length}`);
    }
    const result = await this.postgres.query<FlagRow>(
      `${flagSelectSql}
       ${whereClause(conditions)}
       ORDER BY f.triggered_at DESC`,
      values,
    );
    return result.rows.map(toPublicFlag);
  }

  async findById(flagId: string): Promise<PublicFlag | undefined> {
    if (isUuid(flagId) === false) {
      return undefined;
    }
    const result = await this.postgres.query<FlagRow>(
      `${flagSelectSql} WHERE f.id = $1`,
      [flagId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return toPublicFlag(row);
  }

  async resolve(flagId: string, resolvedBy: string) {
    await this.postgres.query(
      `UPDATE intervention_flags
       SET intervention_flag_status_id = s.intervention_flag_status_id,
           resolved_by = $2,
           resolved_at = now()
       FROM intervention_flag_statuses s
       WHERE intervention_flags.id = $1 AND s.status_code = 'resolved'`,
      [flagId, resolvedBy],
    );
  }
}
