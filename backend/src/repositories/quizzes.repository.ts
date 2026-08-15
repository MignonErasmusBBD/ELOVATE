import { Injectable } from '@nestjs/common';
import {
  booleanFromDatabase,
  dateFromDatabase,
  isUuid,
  SqlParameter,
  SqlQuery,
  whereClause,
} from '../helpers/values';
import { PostgresService } from '../services/postgres.service';

type AttemptRow = {
  id: string;
  user_id: string;
  course_id: string;
  organization_id: string;
  generated_at: Date;
  started_at: Date | null;
  completed_at: Date | null;
  status: string;
  rating_at_generation: number;
  rating_at_completion: number | null;
};

type ItemRow = {
  id: string;
  quiz_attempt_id: string;
  question_id: string;
  prompt: string;
  selected_option_id: string | null;
  is_correct: boolean | null;
  answered_at: Date | null;
};

type ItemOptionRow = {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  position: number;
};

export type PublicAttemptOption = {
  id: string;
  optionText: string;
  position: number;
  isCorrect: boolean | undefined;
};

export type PublicAttemptItem = {
  id: string;
  questionId: string;
  prompt: string;
  selectedOptionId: string | undefined;
  isCorrect: boolean | undefined;
  answeredAt: Date | undefined;
  options: PublicAttemptOption[];
};

export type PublicAttempt = {
  id: string;
  userId: string;
  courseId: string;
  organizationId: string;
  generatedAt: Date;
  startedAt: Date | undefined;
  completedAt: Date | undefined;
  status: string;
  ratingAtGeneration: number;
  ratingAtCompletion: number | undefined;
  items: PublicAttemptItem[];
};

export type AttemptListFilters = {
  userId: string | undefined;
  organizationId: string | undefined;
  courseId: string | undefined;
  status: string | undefined;
};

export type GeneratedQuestion = {
  id: string;
  prompt: string;
  bloomLevelId: number;
  difficultyLevelId: number;
  topicIds: string[];
};

const attemptSelectSql = `SELECT
  qa.id,
  qa.user_id,
  qa.course_id,
  u.organization_id,
  qa.generated_at,
  qa.started_at,
  qa.completed_at,
  st.status_code AS status,
  qa.rating_at_generation,
  qa.rating_at_completion
FROM quiz_attempts qa
JOIN users u ON u.id = qa.user_id
JOIN quiz_attempt_statuses st ON st.quiz_attempt_status_id = qa.quiz_attempt_status_id`;

function toPublicAttempt(
  row: AttemptRow,
  items: PublicAttemptItem[],
  hideCorrect: boolean,
): PublicAttempt {
  return {
    id: row.id,
    userId: row.user_id,
    courseId: row.course_id,
    organizationId: row.organization_id,
    generatedAt: row.generated_at,
    startedAt: dateFromDatabase(row.started_at),
    completedAt: dateFromDatabase(row.completed_at),
    status: row.status,
    ratingAtGeneration: row.rating_at_generation,
    ratingAtCompletion:
      row.rating_at_completion === null ? undefined : row.rating_at_completion,
    items: hideCorrect
      ? items.map((item) => ({
          ...item,
          isCorrect: undefined,
          options: item.options.map((option) => ({
            ...option,
            isCorrect: undefined,
          })),
        }))
      : items,
  };
}

@Injectable()
export class QuizzesRepository {
  constructor(private readonly postgres: PostgresService) {}

  async list(filters: AttemptListFilters): Promise<PublicAttempt[]> {
    const values: SqlParameter[] = [];
    const conditions: string[] = [];
    if (filters.userId !== undefined) {
      values.push(filters.userId);
      conditions.push(`qa.user_id = $${values.length}`);
    }
    if (filters.organizationId !== undefined) {
      values.push(filters.organizationId);
      conditions.push(`u.organization_id = $${values.length}`);
    }
    if (filters.courseId !== undefined) {
      values.push(filters.courseId);
      conditions.push(`qa.course_id = $${values.length}`);
    }
    if (filters.status !== undefined) {
      values.push(filters.status);
      conditions.push(`st.status_code = $${values.length}`);
    }
    const result = await this.postgres.query<AttemptRow>(
      `${attemptSelectSql}
       ${whereClause(conditions)}
       ORDER BY qa.generated_at DESC`,
      values,
    );
    const attempts: PublicAttempt[] = [];
    for (const row of result.rows) {
      attempts.push(toPublicAttempt(row, [], this.shouldHideCorrect(row.status)));
    }
    return attempts;
  }

  async findById(attemptId: string): Promise<PublicAttempt | undefined> {
    if (isUuid(attemptId) === false) {
      return undefined;
    }
    const result = await this.postgres.query<AttemptRow>(
      `${attemptSelectSql} WHERE qa.id = $1`,
      [attemptId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    const items = await this.loadItems([row.id]);
    const attemptItems = items.get(row.id);
    return toPublicAttempt(
      row,
      attemptItems === undefined ? [] : attemptItems,
      this.shouldHideCorrect(row.status),
    );
  }

  async currentRating(userId: string, courseId: string): Promise<number> {
    const result = await this.postgres.query<{ current_rating: number }>(
      `SELECT current_rating
       FROM student_course_profile
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return 0;
    }
    return row.current_rating;
  }

  async insertGenerated(input: {
    userId: string;
    courseId: string;
    ratingAtGeneration: number;
    questions: GeneratedQuestion[];
  }): Promise<string> {
    return this.postgres.withTransaction(async (query) => {
      const inserted = await query<{ id: string }>(
        `INSERT INTO quiz_attempts (
           user_id, course_id, quiz_attempt_status_id, rating_at_generation
         )
         SELECT $1, $2, st.quiz_attempt_status_id, $3
         FROM quiz_attempt_statuses st
         WHERE st.status_code = 'generated'
         RETURNING id`,
        [input.userId, input.courseId, input.ratingAtGeneration],
      );
      const row = inserted.rows[0];
      if (row === undefined) {
        throw new Error('Quiz attempt insert returned no row');
      }
      for (const question of input.questions) {
        await query(
          `INSERT INTO quiz_attempt_items (quiz_attempt_id, question_id)
           VALUES ($1, $2)`,
          [row.id, question.id],
        );
      }
      await this.insertWeights(query, row.id, input.questions);
      return row.id;
    });
  }

  async start(attemptId: string) {
    await this.postgres.query(
      `UPDATE quiz_attempts
       SET started_at = now(),
           quiz_attempt_status_id = st.quiz_attempt_status_id
       FROM quiz_attempt_statuses st
       WHERE quiz_attempts.id = $1 AND st.status_code = 'in_progress'`,
      [attemptId],
    );
  }

  async answer(
    attemptItemId: string,
    selectedOptionId: string,
  ): Promise<boolean | undefined> {
    const option = await this.postgres.query<{ is_correct: boolean }>(
      `SELECT is_correct FROM question_options WHERE id = $1`,
      [selectedOptionId],
    );
    const optionRow = option.rows[0];
    if (optionRow === undefined) {
      return undefined;
    }
    const updated = await this.postgres.query<{ id: string }>(
      `UPDATE quiz_attempt_items
       SET selected_option_id = $2,
           is_correct = $3,
           answered_at = now()
       WHERE id = $1
       RETURNING id`,
      [attemptItemId, selectedOptionId, optionRow.is_correct],
    );
    if (updated.rows[0] === undefined) {
      return undefined;
    }
    return optionRow.is_correct;
  }

  async itemBelongsToAttempt(
    attemptId: string,
    attemptItemId: string,
  ): Promise<{ questionId: string } | undefined> {
    const result = await this.postgres.query<{ question_id: string }>(
      `SELECT question_id
       FROM quiz_attempt_items
       WHERE id = $1 AND quiz_attempt_id = $2`,
      [attemptItemId, attemptId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return undefined;
    }
    return { questionId: row.question_id };
  }

  async optionBelongsToQuestion(
    optionId: string,
    questionId: string,
  ): Promise<boolean> {
    const result = await this.postgres.query<{ id: string }>(
      `SELECT id FROM question_options WHERE id = $1 AND question_id = $2`,
      [optionId, questionId],
    );
    return result.rows[0] !== undefined;
  }

  async complete(attemptId: string, userId: string, courseId: string) {
    await this.postgres.withTransaction(async (query) => {
      const scored = await query<{
        question_id: string;
        is_correct: boolean | null;
        bloom_level_id: number;
        difficulty_level_id: number;
      }>(
        `SELECT qi.question_id, qi.is_correct, q.bloom_level_id, q.difficulty_level_id
         FROM quiz_attempt_items qi
         JOIN questions q ON q.id = qi.question_id
         WHERE qi.quiz_attempt_id = $1`,
        [attemptId],
      );
      let correctCount = 0;
      const bloom = new Map<number, { answered: number; correct: number }>();
      const difficulty = new Map<number, { answered: number; correct: number }>();
      for (const row of scored.rows) {
        const isCorrect = row.is_correct === true;
        if (isCorrect) {
          correctCount += 1;
        }
        const bloomStat = bloom.get(row.bloom_level_id);
        if (bloomStat === undefined) {
          bloom.set(row.bloom_level_id, {
            answered: 1,
            correct: isCorrect ? 1 : 0,
          });
        } else {
          bloomStat.answered += 1;
          if (isCorrect) {
            bloomStat.correct += 1;
          }
        }
        const difficultyStat = difficulty.get(row.difficulty_level_id);
        if (difficultyStat === undefined) {
          difficulty.set(row.difficulty_level_id, {
            answered: 1,
            correct: isCorrect ? 1 : 0,
          });
        } else {
          difficultyStat.answered += 1;
          if (isCorrect) {
            difficultyStat.correct += 1;
          }
        }
      }
      const answered = scored.rows.length;
      const previous = await query<{ current_rating: number }>(
        `SELECT current_rating FROM student_course_profile
         WHERE user_id = $1 AND course_id = $2`,
        [userId, courseId],
      );
      const oldRating =
        previous.rows[0] === undefined ? 0 : previous.rows[0].current_rating;
      const delta = (correctCount - (answered - correctCount)) * 10;
      const newRating = oldRating + delta;

      await query(
        `UPDATE quiz_attempts
         SET completed_at = now(),
             rating_at_completion = $2,
             quiz_attempt_status_id = st.quiz_attempt_status_id
         FROM quiz_attempt_statuses st
         WHERE quiz_attempts.id = $1 AND st.status_code = 'completed'`,
        [attemptId, newRating],
      );

      await query(
        `INSERT INTO student_course_profile (
           user_id, course_id, current_rating, questions_answered, correct_count, last_answered_at, updated_at
         )
         VALUES ($1, $2, $3, $4, $5, now(), now())
         ON CONFLICT (user_id, course_id) DO UPDATE SET
           current_rating = EXCLUDED.current_rating,
           questions_answered = student_course_profile.questions_answered + EXCLUDED.questions_answered,
           correct_count = student_course_profile.correct_count + EXCLUDED.correct_count,
           last_answered_at = now(),
           updated_at = now()`,
        [userId, courseId, newRating, answered, correctCount],
      );

      const topicRows = await query<{ topic_id: string; is_correct: boolean | null }>(
        `SELECT DISTINCT qt.topic_id, qi.is_correct, qi.question_id
         FROM quiz_attempt_items qi
         JOIN question_topics qt ON qt.question_id = qi.question_id
         WHERE qi.quiz_attempt_id = $1`,
        [attemptId],
      );
      const topicRollup = new Map<string, { answered: number; correct: number }>();
      for (const row of topicRows.rows) {
        const current = topicRollup.get(row.topic_id);
        const addCorrect = row.is_correct === true ? 1 : 0;
        if (current === undefined) {
          topicRollup.set(row.topic_id, { answered: 1, correct: addCorrect });
        } else {
          current.answered += 1;
          current.correct += addCorrect;
        }
      }
      for (const [topicId, stats] of topicRollup) {
        await query(
          `INSERT INTO student_topic_mastery (
             user_id, course_id, topic_id, questions_answered, correct_count, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, now())
           ON CONFLICT (user_id, course_id, topic_id) DO UPDATE SET
             questions_answered = student_topic_mastery.questions_answered + EXCLUDED.questions_answered,
             correct_count = student_topic_mastery.correct_count + EXCLUDED.correct_count,
             updated_at = now()`,
          [userId, courseId, topicId, stats.answered, stats.correct],
        );
      }
      for (const [difficultyLevelId, stats] of difficulty) {
        await query(
          `INSERT INTO student_difficulty_mastery (
             user_id, course_id, difficulty_level_id, questions_answered, correct_count, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, now())
           ON CONFLICT (user_id, course_id, difficulty_level_id) DO UPDATE SET
             questions_answered = student_difficulty_mastery.questions_answered + EXCLUDED.questions_answered,
             correct_count = student_difficulty_mastery.correct_count + EXCLUDED.correct_count,
             updated_at = now()`,
          [userId, courseId, difficultyLevelId, stats.answered, stats.correct],
        );
      }
      for (const [bloomLevelId, stats] of bloom) {
        await query(
          `INSERT INTO student_bloom_mastery (
             user_id, course_id, bloom_level_id, questions_answered, correct_count, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, now())
           ON CONFLICT (user_id, course_id, bloom_level_id) DO UPDATE SET
             questions_answered = student_bloom_mastery.questions_answered + EXCLUDED.questions_answered,
             correct_count = student_bloom_mastery.correct_count + EXCLUDED.correct_count,
             updated_at = now()`,
          [userId, courseId, bloomLevelId, stats.answered, stats.correct],
        );
      }

      await query(
        `INSERT INTO overall_learning_profile (
           user_id, aggregate_rating, total_courses, total_questions_answered, updated_at
         )
         SELECT
           $1,
           coalesce(avg(current_rating), 0),
           count(*)::int,
           coalesce(sum(questions_answered), 0)::int,
           now()
         FROM student_course_profile
         WHERE user_id = $1
         ON CONFLICT (user_id) DO UPDATE SET
           aggregate_rating = EXCLUDED.aggregate_rating,
           total_courses = EXCLUDED.total_courses,
           total_questions_answered = EXCLUDED.total_questions_answered,
           updated_at = now()`,
        [userId],
      );
    });
  }

  private shouldHideCorrect(status: string): boolean {
    return status === 'generated' || status === 'in_progress';
  }

  private async loadItems(
    attemptIds: string[],
  ): Promise<Map<string, PublicAttemptItem[]>> {
    const map = new Map<string, PublicAttemptItem[]>();
    if (attemptIds.length === 0) {
      return map;
    }
    const placeholders = attemptIds
      .map((_id, index) => `$${index + 1}`)
      .join(', ');
    const itemResult = await this.postgres.query<ItemRow>(
      `SELECT qi.id, qi.quiz_attempt_id, qi.question_id, q.prompt,
              qi.selected_option_id, qi.is_correct, qi.answered_at
       FROM quiz_attempt_items qi
       JOIN questions q ON q.id = qi.question_id
       WHERE qi.quiz_attempt_id IN (${placeholders})
       ORDER BY qi.id`,
      attemptIds,
    );
    const questionIds = itemResult.rows.map((row) => row.question_id);
    const optionMap = new Map<string, PublicAttemptOption[]>();
    if (questionIds.length > 0) {
      const uniqueQuestionIds: string[] = [];
      for (const questionId of questionIds) {
        if (uniqueQuestionIds.includes(questionId) === false) {
          uniqueQuestionIds.push(questionId);
        }
      }
      const optionPlaceholders = uniqueQuestionIds
        .map((_id, index) => `$${index + 1}`)
        .join(', ');
      const optionResult = await this.postgres.query<ItemOptionRow>(
        `SELECT id, question_id, option_text, is_correct, position
         FROM question_options
         WHERE question_id IN (${optionPlaceholders})
         ORDER BY position`,
        uniqueQuestionIds,
      );
      for (const option of optionResult.rows) {
        const list = optionMap.get(option.question_id);
        const mapped = {
          id: option.id,
          optionText: option.option_text,
          position: option.position,
          isCorrect: option.is_correct,
        };
        if (list === undefined) {
          optionMap.set(option.question_id, [mapped]);
        } else {
          list.push(mapped);
        }
      }
    }
    for (const row of itemResult.rows) {
      const options = optionMap.get(row.question_id);
      const item: PublicAttemptItem = {
        id: row.id,
        questionId: row.question_id,
        prompt: row.prompt,
        selectedOptionId:
          row.selected_option_id === null ? undefined : row.selected_option_id,
        isCorrect: booleanFromDatabase(row.is_correct),
        answeredAt: dateFromDatabase(row.answered_at),
        options: options === undefined ? [] : options,
      };
      const list = map.get(row.quiz_attempt_id);
      if (list === undefined) {
        map.set(row.quiz_attempt_id, [item]);
      } else {
        list.push(item);
      }
    }
    return map;
  }

  private async insertWeights(
    query: SqlQuery,
    attemptId: string,
    questions: GeneratedQuestion[],
  ) {
    const total = questions.length;
    if (total === 0) {
      return;
    }
    const bloom = new Map<number, number>();
    const difficulty = new Map<number, number>();
    const topics = new Map<string, number>();
    for (const question of questions) {
      const bloomCount = bloom.get(question.bloomLevelId);
      bloom.set(
        question.bloomLevelId,
        bloomCount === undefined ? 1 : bloomCount + 1,
      );
      const difficultyCount = difficulty.get(question.difficultyLevelId);
      difficulty.set(
        question.difficultyLevelId,
        difficultyCount === undefined ? 1 : difficultyCount + 1,
      );
      for (const topicId of question.topicIds) {
        const topicCount = topics.get(topicId);
        topics.set(topicId, topicCount === undefined ? 1 : topicCount + 1);
      }
    }
    for (const [bloomLevelId, count] of bloom) {
      await query(
        `INSERT INTO quiz_bloom_weights (
           quiz_attempt_id, bloom_level_id, target_weight, questions_allocated
         ) VALUES ($1, $2, $3, $4)`,
        [attemptId, bloomLevelId, count / total, count],
      );
    }
    for (const [difficultyLevelId, count] of difficulty) {
      await query(
        `INSERT INTO quiz_difficulty_weights (
           quiz_attempt_id, difficulty_level_id, target_weight, questions_allocated
         ) VALUES ($1, $2, $3, $4)`,
        [attemptId, difficultyLevelId, count / total, count],
      );
    }
    for (const [topicId, count] of topics) {
      await query(
        `INSERT INTO quiz_topic_weights (
           quiz_attempt_id, topic_id, target_weight, questions_allocated
         ) VALUES ($1, $2, $3, $4)`,
        [attemptId, topicId, count / total, count],
      );
    }
  }
}
