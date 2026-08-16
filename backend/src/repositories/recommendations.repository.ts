import { Injectable } from '@nestjs/common';
import { PostgresService } from '../services/postgres.service';
import {
  Audience,
  FlagType,
  RecommendationCategory,
  CtaType,
  TEMPLATES,
  fillTemplate,
} from './recommendation-templates';

// Minimum questions answered before a section is included in flag evaluation.
const MIN_QUESTIONS_FOR_FLAG = 3;
// Section score below this triggers repeated_low_topic and content_not_retained.
const LOW_SCORE_THRESHOLD = 50;
// Sections-below-threshold proportion that triggers broad_knowledge_gap.
const BROAD_GAP_PROPORTION = 0.7;
// Minimum sections with data before broad_knowledge_gap can fire.
const BROAD_GAP_MIN_SECTIONS = 2;
// This attempt score below which fast_low_score may trigger.
const FAST_LOW_SCORE_THRESHOLD = 60;
// This attempt must be faster than this fraction of median to trigger fast_low_score.
const FAST_TIME_FRACTION = 0.6;
// Minimum previous attempts needed to have a reliable median for fast_low_score.
const FAST_LOW_SCORE_MIN_PREV = 2;
// Per-question time (seconds) below which a hard question is considered rushed.
const RUSHED_QUESTION_SECONDS = 20;
// Minimum rushed+wrong hard questions in the attempt to trigger rushed_difficult_questions.
const RUSHED_QUESTION_MIN_COUNT = 2;
// Content view time must be this multiple of median to trigger content_not_retained.
const HIGH_VIEW_TIME_MULTIPLE = 1.5;

export type RenderedRecommendation = {
  id: string;
  flagType: FlagType;
  category: RecommendationCategory;
  sentence: string;
  evidence: string;
  cta: CtaType;
  sectionId: string | undefined;
  sectionTitle: string | undefined;
};

type ActiveRow = {
  id: string;
  flag_type: string;
  target_ref: string | null;
};

type FlagSpec = {
  flagType: FlagType;
  targetRef: string | null;
  evidence: Record<string, string | number>;
};

@Injectable()
export class RecommendationsRepository {
  constructor(private readonly postgres: PostgresService) {}

  async evaluateAndPersist(
    userId: string,
    courseId: string,
    attemptId: string,
  ): Promise<void> {
    const [flags, activeRows] = await Promise.all([
      this.detectFlags(userId, courseId, attemptId),
      this.postgres.query<ActiveRow>(
        `SELECT sr.id, sr.flag_type, sr.target_ref
         FROM student_recommendations sr
         JOIN recommendation_statuses rs
           ON rs.recommendation_status_id = sr.recommendation_status_id
         WHERE sr.student_id = $1 AND sr.course_id = $2 AND rs.status_code = 'active'`,
        [userId, courseId],
      ),
    ]);

    const activeByKey = new Map<string, string>();
    for (const row of activeRows.rows) {
      activeByKey.set(rowKey(row.flag_type, row.target_ref), row.id);
    }

    const currentKeys = new Set<string>();
    for (const flag of flags) {
      const key = rowKey(flag.flagType, flag.targetRef);
      currentKeys.add(key);
      const existingId = activeByKey.get(key);

      if (existingId !== undefined) {
        // Already active — refresh evaluation time and evidence.
        await this.postgres.query(
          `UPDATE student_recommendations
           SET last_evaluated_at = now(), evidence = $2
           WHERE id = $1`,
          [existingId, JSON.stringify(flag.evidence)],
        );
      } else {
        // Check if a resolved row exists to reopen, else insert.
        const resolved = await this.postgres.query<{ id: string }>(
          flag.targetRef !== null
            ? `SELECT sr.id FROM student_recommendations sr
               JOIN recommendation_statuses rs
                 ON rs.recommendation_status_id = sr.recommendation_status_id
               WHERE sr.student_id = $1 AND sr.course_id = $2
                 AND sr.flag_type = $3 AND sr.target_ref = $4 AND rs.status_code = 'resolved'
               LIMIT 1`
            : `SELECT sr.id FROM student_recommendations sr
               JOIN recommendation_statuses rs
                 ON rs.recommendation_status_id = sr.recommendation_status_id
               WHERE sr.student_id = $1 AND sr.course_id = $2
                 AND sr.flag_type = $3 AND sr.target_ref IS NULL AND rs.status_code = 'resolved'
               LIMIT 1`,
          flag.targetRef !== null
            ? [userId, courseId, flag.flagType, flag.targetRef]
            : [userId, courseId, flag.flagType],
        );

        if (resolved.rows[0] !== undefined) {
          await this.postgres.query(
            `UPDATE student_recommendations
             SET recommendation_status_id = rs.recommendation_status_id,
                 triggered_at = now(), last_evaluated_at = now(),
                 evidence = $2, resolved_at = NULL
             FROM recommendation_statuses rs
             WHERE student_recommendations.id = $1 AND rs.status_code = 'active'`,
            [resolved.rows[0].id, JSON.stringify(flag.evidence)],
          );
        } else {
          await this.postgres.query(
            `INSERT INTO student_recommendations
               (student_id, course_id, flag_type, target_ref, recommendation_status_id, evidence)
             SELECT $1, $2, $3, $4, rs.recommendation_status_id, $5
             FROM recommendation_statuses rs
             WHERE rs.status_code = 'active'`,
            [userId, courseId, flag.flagType, flag.targetRef, JSON.stringify(flag.evidence)],
          );
        }
      }
    }

    // Resolve flags that no longer hold.
    for (const [key, id] of activeByKey) {
      if (!currentKeys.has(key)) {
        await this.postgres.query(
          `UPDATE student_recommendations
           SET recommendation_status_id = rs.recommendation_status_id,
               resolved_at = now(), last_evaluated_at = now()
           FROM recommendation_statuses rs
           WHERE student_recommendations.id = $1 AND rs.status_code = 'resolved'`,
          [id],
        );
      }
    }
  }

  async listActiveForDashboard(
    userId: string,
    courseId: string,
    audience: Audience = 'student',
  ): Promise<RenderedRecommendation[]> {
    const rows = await this.postgres.query<{
      id: string;
      flag_type: string;
      target_ref: string | null;
      evidence: Record<string, string | number>;
      section_title: string | null;
    }>(
      `SELECT sr.id, sr.flag_type, sr.target_ref, sr.evidence,
              cs.title AS section_title
       FROM student_recommendations sr
       JOIN recommendation_statuses rs
         ON rs.recommendation_status_id = sr.recommendation_status_id
       LEFT JOIN course_sections cs ON cs.id = sr.target_ref
       WHERE sr.student_id = $1 AND sr.course_id = $2 AND rs.status_code = 'active'
       ORDER BY sr.triggered_at DESC`,
      [userId, courseId],
    );

    const result: RenderedRecommendation[] = [];
    for (const row of rows.rows) {
      const flagType = row.flag_type as FlagType;
      const key = `${flagType}:${audience}` as `${FlagType}:${Audience}`;
      const template = TEMPLATES[key];
      if (template === undefined) continue;

      const vars: Record<string, string | number> = { ...row.evidence };
      // Rows written before the attempts→questions rename still carry 'attempts'.
      if (vars['questions'] === undefined && vars['attempts'] !== undefined) {
        vars['questions'] = vars['attempts'];
      }
      if (row.section_title !== null) {
        vars['topic'] = row.section_title;
      }

      result.push({
        id: row.id,
        flagType,
        category: template.category,
        sentence: fillTemplate(template.sentence, vars),
        evidence: fillTemplate(template.evidence, vars),
        cta: template.cta,
        sectionId: row.target_ref ?? undefined,
        sectionTitle: row.section_title ?? undefined,
      });
    }
    return result;
  }

  private async detectFlags(
    userId: string,
    courseId: string,
    attemptId: string,
  ): Promise<FlagSpec[]> {
    const flags: FlagSpec[] = [];

    const [
      sectionMastery,
      attemptStats,
      prevMedian,
      hardRushed,
      contentRetention,
    ] = await Promise.all([
      this.sectionMasteryRows(userId, courseId),
      this.attemptScoreAndTime(attemptId),
      this.medianTimePrevAttempts(userId, courseId, attemptId),
      this.rushedHardQuestions(attemptId),
      this.contentRetentionRows(userId, courseId),
    ]);

    // --- repeated_low_topic ---
    for (const row of sectionMastery) {
      const score = row.questions_answered > 0
        ? (row.correct_count / row.questions_answered) * 100
        : 0;
      if (score < LOW_SCORE_THRESHOLD) {
        flags.push({
          flagType: 'repeated_low_topic',
          targetRef: row.course_section_id,
          evidence: {
            score: Math.round(score),
            questions: row.questions_answered,
            threshold: LOW_SCORE_THRESHOLD,
          },
        });
      }
    }

    // --- fast_low_score ---
    if (
      attemptStats !== undefined &&
      prevMedian !== undefined &&
      prevMedian.count >= FAST_LOW_SCORE_MIN_PREV &&
      prevMedian.median > 0 &&
      attemptStats.time_seconds !== null &&
      attemptStats.time_seconds < prevMedian.median * FAST_TIME_FRACTION &&
      attemptStats.score_percent !== null &&
      attemptStats.score_percent < FAST_LOW_SCORE_THRESHOLD
    ) {
      flags.push({
        flagType: 'fast_low_score',
        targetRef: null,
        evidence: {
          score: Math.round(attemptStats.score_percent),
          time: Math.round(attemptStats.time_seconds),
          median: Math.round(prevMedian.median),
        },
      });
    }

    // --- broad_knowledge_gap ---
    const gradedSections = sectionMastery.filter(
      (r) => r.questions_answered >= MIN_QUESTIONS_FOR_FLAG,
    );
    if (gradedSections.length >= BROAD_GAP_MIN_SECTIONS) {
      const lowCount = gradedSections.filter(
        (r) =>
          r.questions_answered > 0 &&
          (r.correct_count / r.questions_answered) * 100 < LOW_SCORE_THRESHOLD,
      ).length;
      const gapPercent = Math.round(
        (lowCount / gradedSections.length) * 100,
      );
      if (lowCount / gradedSections.length > BROAD_GAP_PROPORTION) {
        flags.push({
          flagType: 'broad_knowledge_gap',
          targetRef: null,
          evidence: {
            gap_percent: gapPercent,
            low_section_count: lowCount,
            total_section_count: gradedSections.length,
          },
        });
      }
    }

    // --- rushed_difficult_questions ---
    if (hardRushed.rushed_wrong_count >= RUSHED_QUESTION_MIN_COUNT) {
      flags.push({
        flagType: 'rushed_difficult_questions',
        targetRef: null,
        evidence: {
          rushed_count: hardRushed.rushed_wrong_count,
          threshold_seconds: RUSHED_QUESTION_SECONDS,
        },
      });
    }

    // --- content_not_retained ---
    for (const row of contentRetention) {
      const score = row.questions_answered > 0
        ? (row.correct_count / row.questions_answered) * 100
        : 0;
      if (
        score < LOW_SCORE_THRESHOLD &&
        row.avg_view_seconds > row.median_view_seconds * HIGH_VIEW_TIME_MULTIPLE
      ) {
        flags.push({
          flagType: 'content_not_retained',
          targetRef: row.course_section_id,
          evidence: {
            score: Math.round(score),
            avg_view_seconds: Math.round(row.avg_view_seconds),
          },
        });
      }
    }

    // De-duplicate: if a section has both repeated_low_topic and content_not_retained,
    // keep only content_not_retained (it's the more specific diagnosis).
    const contentRetainedRefs = new Set(
      flags
        .filter((f) => f.flagType === 'content_not_retained' && f.targetRef !== null)
        .map((f) => f.targetRef),
    );
    return flags.filter(
      (f) =>
        f.flagType !== 'repeated_low_topic' ||
        !contentRetainedRefs.has(f.targetRef),
    );
  }

  private async sectionMasteryRows(
    userId: string,
    courseId: string,
  ): Promise<
    Array<{
      course_section_id: string;
      questions_answered: number;
      correct_count: number;
    }>
  > {
    const result = await this.postgres.query<{
      course_section_id: string;
      questions_answered: number;
      correct_count: number;
    }>(
      `SELECT course_section_id, questions_answered, correct_count
       FROM student_section_mastery
       WHERE user_id = $1 AND course_id = $2
         AND questions_answered >= ${MIN_QUESTIONS_FOR_FLAG}`,
      [userId, courseId],
    );
    return result.rows;
  }

  private async attemptScoreAndTime(
    attemptId: string,
  ): Promise<{ score_percent: number | null; time_seconds: number | null } | undefined> {
    const result = await this.postgres.query<{
      score_percent: number | null;
      time_seconds: number | null;
    }>(
      `SELECT
         (count(*) FILTER (WHERE qi.is_correct = true)::float
          / NULLIF(count(qi.id), 0)::float * 100) AS score_percent,
         EXTRACT(EPOCH FROM (qa.completed_at - qa.started_at))::float AS time_seconds
       FROM quiz_attempts qa
       JOIN quiz_attempt_items qi ON qi.quiz_attempt_id = qa.id
       WHERE qa.id = $1
       GROUP BY qa.id, qa.completed_at, qa.started_at`,
      [attemptId],
    );
    return result.rows[0];
  }

  private async medianTimePrevAttempts(
    userId: string,
    courseId: string,
    excludeAttemptId: string,
  ): Promise<{ median: number; count: number } | undefined> {
    const result = await this.postgres.query<{
      median: number | null;
      count: number;
    }>(
      `SELECT
         percentile_cont(0.5) WITHIN GROUP (
           ORDER BY EXTRACT(EPOCH FROM (qa.completed_at - qa.started_at))
         ) AS median,
         count(*)::int AS count
       FROM quiz_attempts qa
       JOIN quiz_attempt_statuses st
         ON st.quiz_attempt_status_id = qa.quiz_attempt_status_id
       WHERE qa.user_id = $1 AND qa.course_id = $2
         AND st.status_code = 'completed'
         AND qa.id != $3
         AND qa.started_at IS NOT NULL AND qa.completed_at IS NOT NULL`,
      [userId, courseId, excludeAttemptId],
    );
    const row = result.rows[0];
    if (row === undefined || row.median === null) return undefined;
    return { median: row.median, count: row.count };
  }

  private async rushedHardQuestions(
    attemptId: string,
  ): Promise<{ rushed_wrong_count: number }> {
    const result = await this.postgres.query<{ rushed_wrong_count: number }>(
      `SELECT
         count(*) FILTER (WHERE
           dl.level_name IN ('Hard', 'Expert')
           AND qi.is_correct = false
           AND qi.question_started_at IS NOT NULL
           AND qi.answered_at IS NOT NULL
           AND EXTRACT(EPOCH FROM (qi.answered_at - qi.question_started_at))
               < ${RUSHED_QUESTION_SECONDS}
         )::int AS rushed_wrong_count
       FROM quiz_attempt_items qi
       JOIN questions q ON q.id = qi.question_id
       JOIN difficulty_levels dl ON dl.difficulty_level_id = q.difficulty_level_id
       WHERE qi.quiz_attempt_id = $1`,
      [attemptId],
    );
    return result.rows[0] ?? { rushed_wrong_count: 0 };
  }

  private async contentRetentionRows(
    userId: string,
    courseId: string,
  ): Promise<
    Array<{
      course_section_id: string;
      avg_view_seconds: number;
      median_view_seconds: number;
      questions_answered: number;
      correct_count: number;
    }>
  > {
    const result = await this.postgres.query<{
      course_section_id: string;
      avg_view_seconds: number;
      median_view_seconds: number;
      questions_answered: number;
      correct_count: number;
    }>(
      `WITH section_views AS (
         SELECT
           course_section_id,
           avg(duration_seconds)::float AS avg_view_seconds
         FROM content_view_sessions
         WHERE user_id = $1 AND course_id = $2
         GROUP BY course_section_id
       ),
       course_median AS (
         SELECT percentile_cont(0.5) WITHIN GROUP (
           ORDER BY avg_view_seconds
         ) AS median_view_seconds
         FROM section_views
       )
       SELECT
         sv.course_section_id,
         sv.avg_view_seconds,
         cm.median_view_seconds,
         ssm.questions_answered,
         ssm.correct_count
       FROM section_views sv
       CROSS JOIN course_median cm
       JOIN student_section_mastery ssm
         ON ssm.course_section_id = sv.course_section_id
         AND ssm.user_id = $1 AND ssm.course_id = $2
       WHERE ssm.questions_answered >= ${MIN_QUESTIONS_FOR_FLAG}`,
      [userId, courseId],
    );
    return result.rows;
  }
}

function rowKey(flagType: string, targetRef: string | null): string {
  return `${flagType}:${targetRef ?? '__null__'}`;
}
