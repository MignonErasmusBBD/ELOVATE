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
  question_started_at: Date | null;
  bloom_level: string | null;
  difficulty_level: string | null;
  section_title: string | null;
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
  questionStartedAt: Date | undefined;
  bloomLevel: string | undefined;
  difficultyLevel: string | undefined;
  sectionTitle: string | undefined;
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
  courseSectionId: string;
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
    // Reveal correctness only for items the student has already answered.
    // Unanswered items during in_progress keep isCorrect hidden so students
    // cannot snoop upcoming answers from the network response.
    items: items.map((item) => {
      const shouldHide =
        row.status === 'generated' ||
        (row.status === 'in_progress' && item.answeredAt === undefined);
      if (shouldHide) {
        return {
          ...item,
          isCorrect: undefined,
          options: item.options.map((opt) => ({ ...opt, isCorrect: undefined })),
        };
      }
      return item;
    }),
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
      attempts.push(toPublicAttempt(row, []));
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
    await this.postgres.withTransaction(async (query) => {
      await query(
        `UPDATE quiz_attempts
         SET started_at = now(),
             quiz_attempt_status_id = st.quiz_attempt_status_id
         FROM quiz_attempt_statuses st
         WHERE quiz_attempts.id = $1 AND st.status_code = 'in_progress'`,
        [attemptId],
      );
      await query(
        `UPDATE quiz_attempt_items
         SET question_started_at = now()
         WHERE id = (
           SELECT id FROM quiz_attempt_items
           WHERE quiz_attempt_id = $1
           ORDER BY id
           LIMIT 1
         )`,
        [attemptId],
      );
    });
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
    const updated = await this.postgres.query<{ id: string; quiz_attempt_id: string }>(
      `UPDATE quiz_attempt_items
       SET selected_option_id = $2,
           is_correct = $3,
           answered_at = now()
       WHERE id = $1
       RETURNING id, quiz_attempt_id`,
      [attemptItemId, selectedOptionId, optionRow.is_correct],
    );
    const updatedRow = updated.rows[0];
    if (updatedRow === undefined) {
      return undefined;
    }
    await this.postgres.query(
      `UPDATE quiz_attempt_items
       SET question_started_at = now()
       WHERE id = (
         SELECT id FROM quiz_attempt_items
         WHERE quiz_attempt_id = $1
           AND selected_option_id IS NULL
           AND question_started_at IS NULL
         ORDER BY id
         LIMIT 1
       )`,
      [updatedRow.quiz_attempt_id],
    );
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

      const sectionRows = await query<{ course_section_id: string; is_correct: boolean | null }>(
        `SELECT q.course_section_id, qi.is_correct
         FROM quiz_attempt_items qi
         JOIN questions q ON q.id = qi.question_id
         WHERE qi.quiz_attempt_id = $1`,
        [attemptId],
      );
      const sectionRollup = new Map<string, { answered: number; correct: number }>();
      for (const row of sectionRows.rows) {
        const current = sectionRollup.get(row.course_section_id);
        const addCorrect = row.is_correct === true ? 1 : 0;
        if (current === undefined) {
          sectionRollup.set(row.course_section_id, { answered: 1, correct: addCorrect });
        } else {
          current.answered += 1;
          current.correct += addCorrect;
        }
      }
      for (const [sectionId, stats] of sectionRollup) {
        await query(
          `INSERT INTO student_section_mastery (
             user_id, course_id, course_section_id, questions_answered, correct_count, updated_at
           )
           VALUES ($1, $2, $3, $4, $5, now())
           ON CONFLICT (user_id, course_id, course_section_id) DO UPDATE SET
             questions_answered = student_section_mastery.questions_answered + EXCLUDED.questions_answered,
             correct_count = student_section_mastery.correct_count + EXCLUDED.correct_count,
             updated_at = now()`,
          [userId, courseId, sectionId, stats.answered, stats.correct],
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

      // Refresh dashboard summary columns on student_course_profile.
      // Aggregate all completed attempts so the dashboard can do a plain read.
      const attemptScores = await query<{
        score_percent: number | null;
        time_seconds: number | null;
      }>(
        `SELECT
           (count(*) FILTER (WHERE qi.is_correct = true)::float
            / NULLIF(count(qi.id), 0)::float * 100) AS score_percent,
           EXTRACT(EPOCH FROM (qa.completed_at - qa.started_at))::float AS time_seconds
         FROM quiz_attempts qa
         JOIN quiz_attempt_items qi ON qi.quiz_attempt_id = qa.id
         JOIN quiz_attempt_statuses st ON st.quiz_attempt_status_id = qa.quiz_attempt_status_id
         WHERE qa.user_id = $1 AND qa.course_id = $2 AND st.status_code = 'completed'
         GROUP BY qa.id, qa.completed_at, qa.started_at
         ORDER BY qa.completed_at ASC`,
        [userId, courseId],
      );

      const scores = attemptScores.rows.map((r) =>
        r.score_percent === null ? 0 : r.score_percent,
      );
      const times = attemptScores.rows.map((r) =>
        r.time_seconds === null ? 0 : r.time_seconds,
      );
      const totalAttempts = scores.length;

      let avgScorePercent: number | null = null;
      let avgTimeSeconds: number | null = null;
      let bestScorePercent: number | null = null;
      let firstAttemptScorePct: number | null = null;
      let streakAboveTarget = 0;
      let growthDeltaPercent: number | null = null;
      let regressionFlag = false;
      let stalledFlag = false;

      if (totalAttempts > 0) {
        avgScorePercent = scores.reduce((sum, s) => sum + s, 0) / totalAttempts;
        avgTimeSeconds = times.reduce((sum, t) => sum + t, 0) / totalAttempts;
        bestScorePercent = Math.max(...scores);
        firstAttemptScorePct = scores[0] ?? null;

        for (let i = scores.length - 1; i >= 0; i--) {
          if ((scores[i] ?? 0) >= 70) {
            streakAboveTarget++;
          } else {
            break;
          }
        }

        if (totalAttempts >= 4) {
          const n = Math.min(3, Math.floor(totalAttempts / 2));
          const firstN = scores.slice(0, n).reduce((sum, s) => sum + s, 0) / n;
          const lastN = scores.slice(-n).reduce((sum, s) => sum + s, 0) / n;
          growthDeltaPercent = lastN - firstN;
        }

        if (totalAttempts >= 6) {
          const firstThreeAvg =
            ((scores[0] ?? 0) + (scores[1] ?? 0) + (scores[2] ?? 0)) / 3;
          const lastThreeAvg =
            ((scores[totalAttempts - 3] ?? 0) +
              (scores[totalAttempts - 2] ?? 0) +
              (scores[totalAttempts - 1] ?? 0)) /
            3;
          regressionFlag = lastThreeAvg < firstThreeAvg - 5;
        }

        if (totalAttempts >= 5) {
          const lastFive = scores.slice(-5);
          const avg5 = lastFive.reduce((sum, s) => sum + s, 0) / 5;
          const variance =
            lastFive.reduce((sum, s) => sum + (s - avg5) ** 2, 0) / 5;
          stalledFlag = variance < 25 && avg5 < 70;
        }
      }

      // Most improved: bloom level with the largest improvement from first to second half.
      let mostImprovedCategory: string | null = null;
      if (totalAttempts >= 4) {
        const improvedResult = await query<{
          category: string;
          improvement: number;
        }>(
          `WITH ordered_attempts AS (
             SELECT qa.id,
                    row_number() OVER (ORDER BY qa.completed_at ASC) AS rn,
                    count(*) OVER ()                                  AS total
             FROM quiz_attempts qa
             JOIN quiz_attempt_statuses st
               ON st.quiz_attempt_status_id = qa.quiz_attempt_status_id
             WHERE qa.user_id = $1 AND qa.course_id = $2
               AND st.status_code = 'completed'
           ),
           split_items AS (
             SELECT qi.question_id, qi.is_correct,
                    CASE WHEN oa.rn <= oa.total / 2 THEN 'first' ELSE 'second' END AS half
             FROM quiz_attempt_items qi
             JOIN ordered_attempts oa ON oa.id = qi.quiz_attempt_id
           ),
           bloom_perf AS (
             SELECT bl.level_name AS category,
                    avg(CASE WHEN si.is_correct THEN 100.0 ELSE 0.0 END)
                      FILTER (WHERE si.half = 'first')  AS first_pct,
                    avg(CASE WHEN si.is_correct THEN 100.0 ELSE 0.0 END)
                      FILTER (WHERE si.half = 'second') AS second_pct
             FROM bloom_levels bl
             JOIN questions q ON q.bloom_level_id = bl.bloom_level_id
             JOIN course_sections cs
               ON cs.id = q.course_section_id AND cs.course_id = $2
             JOIN split_items si ON si.question_id = q.id
             GROUP BY bl.level_name
             HAVING count(*) >= 4
           )
           SELECT category,
                  (second_pct - first_pct) AS improvement
           FROM bloom_perf
           WHERE first_pct IS NOT NULL AND second_pct IS NOT NULL
           ORDER BY improvement DESC NULLS LAST
           LIMIT 1`,
          [userId, courseId],
        );
        const row = improvedResult.rows[0];
        if (row !== undefined && row.improvement > 0) {
          mostImprovedCategory = row.category;
        }
      }

      await query(
        `UPDATE student_course_profile SET
           total_attempts          = $3,
           avg_score_percent       = $4,
           avg_time_seconds        = $5,
           best_score_percent      = $6,
           first_attempt_score_pct = $7,
           streak_above_target     = $8,
           most_improved_category  = $9,
           growth_delta_percent    = $10,
           regression_flag         = $11,
           stalled_flag            = $12
         WHERE user_id = $1 AND course_id = $2`,
        [
          userId,
          courseId,
          totalAttempts,
          avgScorePercent,
          avgTimeSeconds,
          bestScorePercent,
          firstAttemptScorePct,
          streakAboveTarget,
          mostImprovedCategory,
          growthDeltaPercent,
          regressionFlag,
          stalledFlag,
        ],
      );
    });
  }

  async getStudentMastery(
    userId: string,
    courseId: string,
  ): Promise<{
    sections: Map<string, { answered: number; correct: number }>;
    bloom: Map<number, { answered: number; correct: number }>;
    difficulty: Map<number, { answered: number; correct: number }>;
  }> {
    const [sectionResult, bloomResult, difficultyResult] = await Promise.all([
      this.postgres.query<{
        course_section_id: string;
        questions_answered: number;
        correct_count: number;
      }>(
        `SELECT course_section_id, questions_answered, correct_count
         FROM student_section_mastery
         WHERE user_id = $1 AND course_id = $2`,
        [userId, courseId],
      ),
      this.postgres.query<{
        bloom_level_id: number;
        questions_answered: number;
        correct_count: number;
      }>(
        `SELECT bloom_level_id, questions_answered, correct_count
         FROM student_bloom_mastery
         WHERE user_id = $1 AND course_id = $2`,
        [userId, courseId],
      ),
      this.postgres.query<{
        difficulty_level_id: number;
        questions_answered: number;
        correct_count: number;
      }>(
        `SELECT difficulty_level_id, questions_answered, correct_count
         FROM student_difficulty_mastery
         WHERE user_id = $1 AND course_id = $2`,
        [userId, courseId],
      ),
    ]);

    const sections = new Map(
      sectionResult.rows.map((r) => [
        r.course_section_id,
        { answered: r.questions_answered, correct: r.correct_count },
      ]),
    );
    const bloom = new Map(
      bloomResult.rows.map((r) => [
        r.bloom_level_id,
        { answered: r.questions_answered, correct: r.correct_count },
      ]),
    );
    const difficulty = new Map(
      difficultyResult.rows.map((r) => [
        r.difficulty_level_id,
        { answered: r.questions_answered, correct: r.correct_count },
      ]),
    );

    return { sections, bloom, difficulty };
  }

  async getSeenQuestionIds(userId: string, courseId: string): Promise<Set<string>> {
    const result = await this.postgres.query<{ question_id: string }>(
      `SELECT DISTINCT qi.question_id
       FROM quiz_attempt_items qi
       JOIN quiz_attempts qa ON qa.id = qi.quiz_attempt_id
       WHERE qa.user_id = $1 AND qa.course_id = $2`,
      [userId, courseId],
    );
    return new Set(result.rows.map((r) => r.question_id));
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
              qi.selected_option_id, qi.is_correct, qi.answered_at,
              qi.question_started_at,
              bl.level_name AS bloom_level,
              dl.level_name AS difficulty_level,
              cs.title AS section_title
       FROM quiz_attempt_items qi
       JOIN questions q ON q.id = qi.question_id
       JOIN course_sections cs ON cs.id = q.course_section_id
       LEFT JOIN bloom_levels bl ON bl.bloom_level_id = q.bloom_level_id
       LEFT JOIN difficulty_levels dl ON dl.difficulty_level_id = q.difficulty_level_id
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
        questionStartedAt: dateFromDatabase(row.question_started_at),
        bloomLevel: row.bloom_level === null ? undefined : row.bloom_level,
        difficultyLevel: row.difficulty_level === null ? undefined : row.difficulty_level,
        sectionTitle: row.section_title === null ? undefined : row.section_title,
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
    const sections = new Map<string, number>();
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
      const sectionCount = sections.get(question.courseSectionId);
      sections.set(
        question.courseSectionId,
        sectionCount === undefined ? 1 : sectionCount + 1,
      );
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
    for (const [sectionId, count] of sections) {
      await query(
        `INSERT INTO quiz_section_weights (
           quiz_attempt_id, course_section_id, target_weight, questions_allocated
         ) VALUES ($1, $2, $3, $4)`,
        [attemptId, sectionId, count / total, count],
      );
    }
  }
}
