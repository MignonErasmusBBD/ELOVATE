import { Injectable } from '@nestjs/common';
import {
  isUuid,
  SqlParameter,
  SqlQuery,
  whereClause,
} from '../helpers/values';
import { PostgresService } from '../services/postgres.service';

type QuestionRow = {
  id: string;
  course_section_id: string;
  course_id: string;
  question_format_id: number;
  format_code: string;
  prompt: string;
  bloom_level_id: number;
  difficulty_level_id: number;
  base_difficulty: number;
  status: string;
  created_by: string;
  created_at: Date;
};

type OptionRow = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  position: number;
};

type TopicLinkRow = {
  question_id: string;
  topic_id: string;
};

export type PublicQuestionOption = {
  id: string;
  optionText: string;
  isCorrect: boolean;
  position: number;
};

export type PublicQuestion = {
  id: string;
  courseSectionId: string;
  courseId: string;
  questionFormatId: number;
  formatCode: string;
  prompt: string;
  bloomLevelId: number;
  difficultyLevelId: number;
  baseDifficulty: number;
  status: string;
  createdBy: string;
  createdAt: Date;
  options: PublicQuestionOption[];
  topicIds: string[];
};

export type QuestionListFilters = {
  sectionId: string | undefined;
  courseId: string | undefined;
  topicId: string | undefined;
  bloomLevelId: number | undefined;
  difficultyLevelId: number | undefined;
  questionFormatId: number | undefined;
  status: string | undefined;
};

export type QuestionAuthoringAccess = {
  includeCommunity: boolean;
  privateOrganizationId: string | undefined;
};

export type QuestionOptionInput = {
  optionText: string;
  isCorrect: boolean;
  position: number;
};

const questionSelectSql = `SELECT
  q.id,
  q.course_section_id,
  cs.course_id,
  q.question_format_id,
  qf.format_code,
  q.prompt,
  q.bloom_level_id,
  q.difficulty_level_id,
  q.base_difficulty,
  qs.status_code AS status,
  q.created_by,
  q.created_at
FROM questions q
JOIN course_sections cs ON cs.id = q.course_section_id
JOIN courses c ON c.id = cs.course_id
JOIN course_visibilities cv ON cv.course_visibility_id = c.course_visibility_id
JOIN question_formats qf ON qf.question_format_id = q.question_format_id
JOIN question_statuses qs ON qs.question_status_id = q.question_status_id`;

function authoringSql(
  access: QuestionAuthoringAccess,
  values: SqlParameter[],
): string {
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
  if (parts.length === 0) {
    return 'false';
  }
  return `(${parts.join(' OR ')})`;
}

function toPublicQuestion(
  row: QuestionRow,
  options: PublicQuestionOption[],
  topicIds: string[],
): PublicQuestion {
  return {
    id: row.id,
    courseSectionId: row.course_section_id,
    courseId: row.course_id,
    questionFormatId: row.question_format_id,
    formatCode: row.format_code,
    prompt: row.prompt,
    bloomLevelId: row.bloom_level_id,
    difficultyLevelId: row.difficulty_level_id,
    baseDifficulty: row.base_difficulty,
    status: row.status,
    createdBy: row.created_by,
    createdAt: row.created_at,
    options,
    topicIds,
  };
}

@Injectable()
export class QuestionsRepository {
  constructor(private readonly postgres: PostgresService) {}

  async list(
    filters: QuestionListFilters,
    access: QuestionAuthoringAccess,
  ): Promise<PublicQuestion[]> {
    const values: SqlParameter[] = [];
    const conditions: string[] = [authoringSql(access, values)];
    if (filters.sectionId !== undefined) {
      values.push(filters.sectionId);
      conditions.push(`q.course_section_id = $${values.length}`);
    }
    if (filters.courseId !== undefined) {
      values.push(filters.courseId);
      conditions.push(`cs.course_id = $${values.length}`);
    }
    if (filters.topicId !== undefined) {
      values.push(filters.topicId);
      conditions.push(`EXISTS (
        SELECT 1 FROM question_topics qt
        WHERE qt.question_id = q.id AND qt.topic_id = $${values.length}
      )`);
    }
    if (filters.bloomLevelId !== undefined) {
      values.push(filters.bloomLevelId);
      conditions.push(`q.bloom_level_id = $${values.length}`);
    }
    if (filters.difficultyLevelId !== undefined) {
      values.push(filters.difficultyLevelId);
      conditions.push(`q.difficulty_level_id = $${values.length}`);
    }
    if (filters.questionFormatId !== undefined) {
      values.push(filters.questionFormatId);
      conditions.push(`q.question_format_id = $${values.length}`);
    }
    if (filters.status !== undefined) {
      values.push(filters.status);
      conditions.push(`qs.status_code = $${values.length}`);
    } else {
      conditions.push(`qs.status_code = 'active'`);
    }
    const result = await this.postgres.query<QuestionRow>(
      `${questionSelectSql}
       ${whereClause(conditions)}
       ORDER BY q.created_at DESC`,
      values,
    );
    return this.withOptionsAndTopics(result.rows);
  }

  async findById(questionId: string): Promise<PublicQuestion | undefined> {
    if (isUuid(questionId) === false) {
      return undefined;
    }
    const result = await this.postgres.query<QuestionRow>(
      `${questionSelectSql} WHERE q.id = $1`,
      [questionId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    const [question] = await this.withOptionsAndTopics([row]);
    return question;
  }

  async insert(input: {
    courseSectionId: string;
    questionFormatId: number;
    prompt: string;
    bloomLevelId: number;
    difficultyLevelId: number;
    baseDifficulty: number;
    createdBy: string;
    options: QuestionOptionInput[];
    topicIds: string[];
  }): Promise<string> {
    return this.postgres.withTransaction(async (query) => {
      const inserted = await query<{ id: string }>(
        `INSERT INTO questions (
           course_section_id, question_format_id, prompt,
           bloom_level_id, difficulty_level_id, base_difficulty, created_by
         )
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [
          input.courseSectionId,
          input.questionFormatId,
          input.prompt,
          input.bloomLevelId,
          input.difficultyLevelId,
          input.baseDifficulty,
          input.createdBy,
        ],
      );
      const row = inserted.rows[0];
      if (row === undefined) {
        throw new Error('Question insert returned no row');
      }
      await this.writeOptions(query, row.id, input.options);
      await this.writeTopics(query, row.id, input.topicIds);
      return row.id;
    });
  }

  async updateFields(
    questionId: string,
    input: {
      courseSectionId: string | undefined;
      prompt: string | undefined;
      questionFormatId: number | undefined;
      bloomLevelId: number | undefined;
      difficultyLevelId: number | undefined;
      baseDifficulty: number | undefined;
    },
  ) {
    const assignments: string[] = [];
    const values: SqlParameter[] = [];
    if (input.courseSectionId !== undefined) {
      values.push(input.courseSectionId);
      assignments.push(`course_section_id = $${values.length}`);
    }
    if (input.prompt !== undefined) {
      values.push(input.prompt);
      assignments.push(`prompt = $${values.length}`);
    }
    if (input.questionFormatId !== undefined) {
      values.push(input.questionFormatId);
      assignments.push(`question_format_id = $${values.length}`);
    }
    if (input.bloomLevelId !== undefined) {
      values.push(input.bloomLevelId);
      assignments.push(`bloom_level_id = $${values.length}`);
    }
    if (input.difficultyLevelId !== undefined) {
      values.push(input.difficultyLevelId);
      assignments.push(`difficulty_level_id = $${values.length}`);
    }
    if (input.baseDifficulty !== undefined) {
      values.push(input.baseDifficulty);
      assignments.push(`base_difficulty = $${values.length}`);
    }
    if (assignments.length === 0) {
      return;
    }
    values.push(questionId);
    await this.postgres.query(
      `UPDATE questions SET ${assignments.join(', ')} WHERE id = $${values.length}`,
      values,
    );
  }

  async replaceOptions(questionId: string, options: QuestionOptionInput[]) {
    await this.postgres.withTransaction(async (query) => {
      await query('DELETE FROM question_options WHERE question_id = $1', [
        questionId,
      ]);
      await this.writeOptions(query, questionId, options);
    });
  }

  async replaceTopics(questionId: string, topicIds: string[]) {
    await this.postgres.withTransaction(async (query) => {
      await query('DELETE FROM question_topics WHERE question_id = $1', [
        questionId,
      ]);
      await this.writeTopics(query, questionId, topicIds);
    });
  }

  async setStatus(questionId: string, statusCode: 'active' | 'deactivated') {
    await this.postgres.query(
      `UPDATE questions
       SET question_status_id = qs.question_status_id
       FROM question_statuses qs
       WHERE questions.id = $1 AND qs.status_code = $2`,
      [questionId, statusCode],
    );
  }

  async hasAttemptItems(questionId: string): Promise<boolean> {
    const result = await this.postgres.query<{ id: string }>(
      'SELECT id FROM quiz_attempt_items WHERE question_id = $1 LIMIT 1',
      [questionId],
    );
    return result.rows[0] !== undefined;
  }

  async listActiveForCourse(courseId: string): Promise<PublicQuestion[]> {
    const result = await this.postgres.query<QuestionRow>(
      `${questionSelectSql}
       WHERE cs.course_id = $1 AND qs.status_code = 'active'
       ORDER BY random()
       LIMIT 10`,
      [courseId],
    );
    return this.withOptionsAndTopics(result.rows);
  }

  private async withOptionsAndTopics(
    rows: QuestionRow[],
  ): Promise<PublicQuestion[]> {
    if (rows.length === 0) {
      return [];
    }
    const ids = rows.map((row) => row.id);
    const placeholders = ids
      .map((_id, index) => `$${index + 1}`)
      .join(', ');
    const optionResult = await this.postgres.query<OptionRow>(
      `SELECT id, question_id, option_text, is_correct, position
       FROM question_options
       WHERE question_id IN (${placeholders})
       ORDER BY position, option_text`,
      ids,
    );
    const topicResult = await this.postgres.query<TopicLinkRow>(
      `SELECT question_id, topic_id
       FROM question_topics
       WHERE question_id IN (${placeholders})`,
      ids,
    );
    return rows.map((row) => {
      const options = optionResult.rows
        .filter((option) => option.question_id === row.id)
        .map((option) => ({
          id: option.id,
          optionText: option.option_text,
          isCorrect: option.is_correct,
          position: option.position,
        }));
      const topicIds = topicResult.rows
        .filter((link) => link.question_id === row.id)
        .map((link) => link.topic_id);
      return toPublicQuestion(row, options, topicIds);
    });
  }

  private async writeOptions(
    query: SqlQuery,
    questionId: string,
    options: QuestionOptionInput[],
  ) {
    for (const option of options) {
      await query(
        `INSERT INTO question_options (question_id, option_text, is_correct, position)
         VALUES ($1, $2, $3, $4)`,
        [questionId, option.optionText, option.isCorrect, option.position],
      );
    }
  }

  private async writeTopics(
    query: SqlQuery,
    questionId: string,
    topicIds: string[],
  ) {
    for (const topicId of topicIds) {
      await query(
        `INSERT INTO question_topics (question_id, topic_id) VALUES ($1, $2)`,
        [questionId, topicId],
      );
    }
  }
}
