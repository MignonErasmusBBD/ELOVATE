import { Injectable } from '@nestjs/common';
import { textFromDatabase } from '../helpers/values';
import { PostgresService } from '../services/postgres.service';

type CodeRow = { id: number; code: string };
type RankedRow = { id: number; name: string; rank: number };
type RoleRow = { role_id: number; role_name: string; role_description: string | null };

@Injectable()
export class LookupsRepository {
  constructor(private readonly postgres: PostgresService) {}

  async oauthProviders() {
    const result = await this.postgres.query<CodeRow>(
      `SELECT oauth_provider_id AS id, provider_code AS code
       FROM oauth_providers ORDER BY oauth_provider_id`,
    );
    return result.rows.map((row) => ({
      oauthProviderId: row.id,
      providerCode: row.code,
    }));
  }

  async courseVisibilities() {
    const result = await this.postgres.query<CodeRow>(
      `SELECT course_visibility_id AS id, visibility_code AS code
       FROM course_visibilities ORDER BY course_visibility_id`,
    );
    return result.rows.map((row) => ({
      courseVisibilityId: row.id,
      visibilityCode: row.code,
    }));
  }

  async questionFormats() {
    const result = await this.postgres.query<CodeRow>(
      `SELECT question_format_id AS id, format_code AS code
       FROM question_formats ORDER BY question_format_id`,
    );
    return result.rows.map((row) => ({
      questionFormatId: row.id,
      formatCode: row.code,
    }));
  }

  async enrollmentStatuses() {
    const result = await this.postgres.query<CodeRow>(
      `SELECT enrollment_status_id AS id, status_code AS code
       FROM enrollment_statuses ORDER BY enrollment_status_id`,
    );
    return result.rows.map((row) => ({
      enrollmentStatusId: row.id,
      statusCode: row.code,
    }));
  }

  async quizAttemptStatuses() {
    const result = await this.postgres.query<CodeRow>(
      `SELECT quiz_attempt_status_id AS id, status_code AS code
       FROM quiz_attempt_statuses ORDER BY quiz_attempt_status_id`,
    );
    return result.rows.map((row) => ({
      quizAttemptStatusId: row.id,
      statusCode: row.code,
    }));
  }

  async bloomLevels() {
    const result = await this.postgres.query<RankedRow>(
      `SELECT bloom_level_id AS id, level_name AS name, level_rank AS rank
       FROM bloom_levels ORDER BY level_rank`,
    );
    return result.rows.map((row) => ({
      bloomLevelId: row.id,
      name: row.name,
      rank: row.rank,
    }));
  }

  async difficultyLevels() {
    const result = await this.postgres.query<RankedRow>(
      `SELECT difficulty_level_id AS id, level_name AS name, level_rank AS rank
       FROM difficulty_levels ORDER BY level_rank`,
    );
    return result.rows.map((row) => ({
      difficultyLevelId: row.id,
      name: row.name,
      rank: row.rank,
    }));
  }

  async interventionTriggerTypes() {
    const result = await this.postgres.query<CodeRow>(
      `SELECT intervention_trigger_type_id AS id, trigger_code AS code
       FROM intervention_trigger_types ORDER BY intervention_trigger_type_id`,
    );
    return result.rows.map((row) => ({
      interventionTriggerTypeId: row.id,
      triggerCode: row.code,
    }));
  }

  async interventionFlagStatuses() {
    const result = await this.postgres.query<CodeRow>(
      `SELECT intervention_flag_status_id AS id, status_code AS code
       FROM intervention_flag_statuses ORDER BY intervention_flag_status_id`,
    );
    return result.rows.map((row) => ({
      interventionFlagStatusId: row.id,
      statusCode: row.code,
    }));
  }

  async userStatuses() {
    const result = await this.postgres.query<CodeRow>(
      `SELECT user_status_id AS id, status_code AS code
       FROM user_statuses ORDER BY user_status_id`,
    );
    return result.rows.map((row) => ({
      userStatusId: row.id,
      statusCode: row.code,
    }));
  }

  async organizationStatuses() {
    const result = await this.postgres.query<CodeRow>(
      `SELECT organization_status_id AS id, status_code AS code
       FROM organization_statuses ORDER BY organization_status_id`,
    );
    return result.rows.map((row) => ({
      organizationStatusId: row.id,
      statusCode: row.code,
    }));
  }

  async courseStatuses() {
    const result = await this.postgres.query<CodeRow>(
      `SELECT course_status_id AS id, status_code AS code
       FROM course_statuses ORDER BY course_status_id`,
    );
    return result.rows.map((row) => ({
      courseStatusId: row.id,
      statusCode: row.code,
    }));
  }

  async questionStatuses() {
    const result = await this.postgres.query<CodeRow>(
      `SELECT question_status_id AS id, status_code AS code
       FROM question_statuses ORDER BY question_status_id`,
    );
    return result.rows.map((row) => ({
      questionStatusId: row.id,
      statusCode: row.code,
    }));
  }

  async roles() {
    const result = await this.postgres.query<RoleRow>(
      `SELECT role_id, role_name, role_description
       FROM roles ORDER BY role_id`,
    );
    return result.rows.map((row) => ({
      roleId: row.role_id,
      roleName: row.role_name,
      roleDescription: textFromDatabase(row.role_description),
    }));
  }
}
