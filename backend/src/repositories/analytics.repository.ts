import { Injectable } from '@nestjs/common';
import { dateFromDatabase, SqlParameter, whereClause } from '../helpers/values';
import { PostgresService } from '../services/postgres.service';
import { RecommendationsRepository } from './recommendations.repository';

type OverallRow = {
  user_id: string;
  aggregate_rating: number;
  total_courses: number;
  total_questions_answered: number;
  updated_at: Date;
};

type CourseProfileRow = {
  user_id: string;
  course_id: string;
  current_rating: number;
  questions_answered: number;
  correct_count: number;
  last_answered_at: Date | null;
  updated_at: Date;
};

type TopicMasteryRow = {
  topic_id: string;
  questions_answered: number;
  correct_count: number;
};

type DifficultyMasteryRow = {
  difficulty_level_id: number;
  questions_answered: number;
  correct_count: number;
};

type BloomMasteryRow = {
  bloom_level_id: number;
  questions_answered: number;
  correct_count: number;
};

type OrgOverviewRow = {
  learner_count: number;
  course_count: number;
  questions_answered: number;
  correct_count: number;
  average_rating: number | null;
};

type OrgAttemptsRow = {
  attempt_count: number;
  completed_count: number;
  average_rating_at_completion: number | null;
};

@Injectable()
export class AnalyticsRepository {
  constructor(
    private readonly postgres: PostgresService,
    private readonly recommendations: RecommendationsRepository,
  ) {}

  async overallProfile(userId: string) {
    const result = await this.postgres.query<OverallRow>(
      `SELECT user_id, aggregate_rating, total_courses, total_questions_answered, updated_at
       FROM overall_learning_profile
       WHERE user_id = $1`,
      [userId],
    );
    const row = result.rows[0];
    if (row === undefined) {
      return {
        userId,
        aggregateRating: 0,
        totalCourses: 0,
        totalQuestionsAnswered: 0,
        updatedAt: undefined,
      };
    }
    return {
      userId: row.user_id,
      aggregateRating: row.aggregate_rating,
      totalCourses: row.total_courses,
      totalQuestionsAnswered: row.total_questions_answered,
      updatedAt: row.updated_at,
    };
  }

  async courseMastery(userId: string, courseId: string) {
    const profile = await this.postgres.query<CourseProfileRow>(
      `SELECT user_id, course_id, current_rating, questions_answered, correct_count, last_answered_at, updated_at
       FROM student_course_profile
       WHERE user_id = $1 AND course_id = $2`,
      [userId, courseId],
    );
    const topics = await this.postgres.query<TopicMasteryRow>(
      `SELECT topic_id, questions_answered, correct_count
       FROM student_topic_mastery
       WHERE user_id = $1 AND course_id = $2
       ORDER BY topic_id`,
      [userId, courseId],
    );
    const difficulty = await this.postgres.query<DifficultyMasteryRow>(
      `SELECT difficulty_level_id, questions_answered, correct_count
       FROM student_difficulty_mastery
       WHERE user_id = $1 AND course_id = $2
       ORDER BY difficulty_level_id`,
      [userId, courseId],
    );
    const bloom = await this.postgres.query<BloomMasteryRow>(
      `SELECT bloom_level_id, questions_answered, correct_count
       FROM student_bloom_mastery
       WHERE user_id = $1 AND course_id = $2
       ORDER BY bloom_level_id`,
      [userId, courseId],
    );
    const row = profile.rows[0];
    return {
      userId,
      courseId,
      currentRating: row === undefined ? 0 : row.current_rating,
      questionsAnswered: row === undefined ? 0 : row.questions_answered,
      correctCount: row === undefined ? 0 : row.correct_count,
      lastAnsweredAt:
        row === undefined ? undefined : dateFromDatabase(row.last_answered_at),
      topics: topics.rows.map((topic) => ({
        topicId: topic.topic_id,
        questionsAnswered: topic.questions_answered,
        correctCount: topic.correct_count,
      })),
      difficulty: difficulty.rows.map((item) => ({
        difficultyLevelId: item.difficulty_level_id,
        questionsAnswered: item.questions_answered,
        correctCount: item.correct_count,
      })),
      bloom: bloom.rows.map((item) => ({
        bloomLevelId: item.bloom_level_id,
        questionsAnswered: item.questions_answered,
        correctCount: item.correct_count,
      })),
    };
  }

  async orgOverview(organizationId: string, courseId: string | undefined) {
    const values: SqlParameter[] = [organizationId];
    const courseFilter =
      courseId === undefined
        ? ''
        : (() => {
            values.push(courseId);
            return `AND scp.course_id = $${values.length}`;
          })();
    const result = await this.postgres.query<OrgOverviewRow>(
      `SELECT
         count(DISTINCT scp.user_id)::int AS learner_count,
         count(DISTINCT scp.course_id)::int AS course_count,
         coalesce(sum(scp.questions_answered), 0)::int AS questions_answered,
         coalesce(sum(scp.correct_count), 0)::int AS correct_count,
         avg(scp.current_rating) AS average_rating
       FROM student_course_profile scp
       JOIN users u ON u.id = scp.user_id
       WHERE u.organization_id = $1 ${courseFilter}`,
      values,
    );
    const row = result.rows[0];
    if (row === undefined) {
      return {
        organizationId,
        courseId,
        learnerCount: 0,
        courseCount: 0,
        questionsAnswered: 0,
        correctCount: 0,
        averageRating: undefined,
      };
    }
    return {
      organizationId,
      courseId,
      learnerCount: row.learner_count,
      courseCount: row.course_count,
      questionsAnswered: row.questions_answered,
      correctCount: row.correct_count,
      averageRating:
        row.average_rating === null ? undefined : row.average_rating,
    };
  }

  async orgAttempts(
    organizationId: string,
    courseId: string | undefined,
    userId: string | undefined,
  ) {
    const values: SqlParameter[] = [organizationId];
    const conditions: string[] = ['u.organization_id = $1'];
    if (courseId !== undefined) {
      values.push(courseId);
      conditions.push(`qa.course_id = $${values.length}`);
    }
    if (userId !== undefined) {
      values.push(userId);
      conditions.push(`qa.user_id = $${values.length}`);
    }
    const result = await this.postgres.query<OrgAttemptsRow>(
      `SELECT
         count(*)::int AS attempt_count,
         count(*) FILTER (WHERE st.status_code = 'completed')::int AS completed_count,
         avg(qa.rating_at_completion) AS average_rating_at_completion
       FROM quiz_attempts qa
       JOIN users u ON u.id = qa.user_id
       JOIN quiz_attempt_statuses st ON st.quiz_attempt_status_id = qa.quiz_attempt_status_id
       ${whereClause(conditions)}`,
      values,
    );
    const row = result.rows[0];
    if (row === undefined) {
      return {
        organizationId,
        courseId,
        userId,
        attemptCount: 0,
        completedCount: 0,
        averageRatingAtCompletion: undefined,
      };
    }
    return {
      organizationId,
      courseId,
      userId,
      attemptCount: row.attempt_count,
      completedCount: row.completed_count,
      averageRatingAtCompletion:
        row.average_rating_at_completion === null
          ? undefined
          : row.average_rating_at_completion,
    };
  }

  async orgMastery(
    organizationId: string,
    courseId: string | undefined,
    userId: string | undefined,
  ) {
    const values: SqlParameter[] = [organizationId];
    const conditions: string[] = ['u.organization_id = $1'];
    if (courseId !== undefined) {
      values.push(courseId);
      conditions.push(`scp.course_id = $${values.length}`);
    }
    if (userId !== undefined) {
      values.push(userId);
      conditions.push(`scp.user_id = $${values.length}`);
    }
    const result = await this.postgres.query<{
      questions_answered: number;
      correct_count: number;
      average_rating: number | null;
    }>(
      `SELECT
         coalesce(sum(scp.questions_answered), 0)::int AS questions_answered,
         coalesce(sum(scp.correct_count), 0)::int AS correct_count,
         avg(scp.current_rating) AS average_rating
       FROM student_course_profile scp
       JOIN users u ON u.id = scp.user_id
       ${whereClause(conditions)}`,
      values,
    );
    const row = result.rows[0];
    return {
      organizationId,
      courseId,
      userId,
      questionsAnswered: row === undefined ? 0 : row.questions_answered,
      correctCount: row === undefined ? 0 : row.correct_count,
      averageRating:
        row === undefined || row.average_rating === null
          ? undefined
          : row.average_rating,
    };
  }

  async studentCourseDashboard(userId: string, courseId: string) {
    const [profileResult, trendResult, bloomResult, sectionResult, difficultyResult, activeRecommendations] =
      await Promise.all([
        this.postgres.query<{
          total_attempts: number;
          avg_score_percent: number | null;
          avg_time_seconds: number | null;
          best_score_percent: number | null;
          first_attempt_score_pct: number | null;
          streak_above_target: number;
          most_improved_category: string | null;
          growth_delta_percent: number | null;
          regression_flag: boolean;
          stalled_flag: boolean;
          questions_answered: number;
          correct_count: number;
        }>(
          `SELECT total_attempts, avg_score_percent, avg_time_seconds,
                  best_score_percent, first_attempt_score_pct,
                  streak_above_target, most_improved_category,
                  growth_delta_percent, regression_flag, stalled_flag,
                  questions_answered, correct_count
           FROM student_course_profile
           WHERE user_id = $1 AND course_id = $2`,
          [userId, courseId],
        ),

        // Last 10 completed attempts — cheap direct query via the partial index.
        this.postgres.query<{
          attempt_num: number;
          score_percent: number;
        }>(
          `WITH attempt_totals AS (
             SELECT qa.id,
                    qa.completed_at,
                    count(*) FILTER (WHERE qi.is_correct = true)  AS correct_count,
                    count(qi.id)                                  AS total_count
             FROM quiz_attempts qa
             JOIN quiz_attempt_items qi ON qi.quiz_attempt_id = qa.id
             JOIN quiz_attempt_statuses st
               ON st.quiz_attempt_status_id = qa.quiz_attempt_status_id
             WHERE qa.user_id = $1 AND qa.course_id = $2
               AND st.status_code = 'completed'
             GROUP BY qa.id, qa.completed_at
           ),
           ranked AS (
             SELECT *,
                    row_number() OVER (ORDER BY completed_at DESC) AS recent_rank,
                    row_number() OVER (ORDER BY completed_at ASC)  AS attempt_num
             FROM attempt_totals
           )
           SELECT attempt_num::int,
                  CASE WHEN total_count > 0
                    THEN (correct_count::float / total_count::float * 100)
                    ELSE 0
                  END AS score_percent
           FROM ranked
           WHERE recent_rank <= 10
           ORDER BY completed_at ASC`,
          [userId, courseId],
        ),

        this.postgres.query<{
          level_name: string;
          questions_answered: number;
          correct_count: number;
        }>(
          `SELECT bl.level_name, sbm.questions_answered, sbm.correct_count
           FROM student_bloom_mastery sbm
           JOIN bloom_levels bl ON bl.bloom_level_id = sbm.bloom_level_id
           WHERE sbm.user_id = $1 AND sbm.course_id = $2
           ORDER BY bl.level_rank`,
          [userId, courseId],
        ),

        this.postgres.query<{
          section_title: string;
          questions_answered: number;
          correct_count: number;
        }>(
          `SELECT cs.title AS section_title, ssm.questions_answered, ssm.correct_count
           FROM student_section_mastery ssm
           JOIN course_sections cs ON cs.id = ssm.course_section_id
           WHERE ssm.user_id = $1 AND ssm.course_id = $2
           ORDER BY cs.position, cs.title`,
          [userId, courseId],
        ),

        this.postgres.query<{
          level_name: string;
          questions_answered: number;
          correct_count: number;
        }>(
          `SELECT dl.level_name, sdm.questions_answered, sdm.correct_count
           FROM student_difficulty_mastery sdm
           JOIN difficulty_levels dl ON dl.difficulty_level_id = sdm.difficulty_level_id
           WHERE sdm.user_id = $1 AND sdm.course_id = $2
           ORDER BY dl.level_rank`,
          [userId, courseId],
        ),

        this.recommendations.listActiveForDashboard(userId, courseId),
      ]);

    const profile = profileResult.rows[0];
    const totalAttempts = profile?.total_attempts ?? 0;
    const overallQuestionsAnswered = profile?.questions_answered ?? 0;
    const overallCorrectCount = profile?.correct_count ?? 0;
    const overallAvgScorePercent =
      overallQuestionsAnswered > 0
        ? (overallCorrectCount / overallQuestionsAnswered) * 100
        : undefined;

    function toBreakdown(rows: { level_name?: string; section_title?: string; questions_answered: number; correct_count: number }[]) {
      return rows.map((r) => ({
        categoryName: r.level_name ?? r.section_title ?? '',
        questionsAnswered: r.questions_answered,
        scorePercent:
          r.questions_answered > 0
            ? (r.correct_count / r.questions_answered) * 100
            : 0,
      }));
    }

    const bloomBreakdown = toBreakdown(
      bloomResult.rows.map((r) => ({ level_name: r.level_name, questions_answered: r.questions_answered, correct_count: r.correct_count })),
    );
    const sectionBreakdown = toBreakdown(
      sectionResult.rows.map((r) => ({ level_name: r.section_title, questions_answered: r.questions_answered, correct_count: r.correct_count })),
    );
    const difficultyBreakdown = toBreakdown(
      difficultyResult.rows.map((r) => ({ level_name: r.level_name, questions_answered: r.questions_answered, correct_count: r.correct_count })),
    );

    return {
      totalAttempts,
      avgScorePercent: profile?.avg_score_percent ?? undefined,
      avgTimeSeconds: profile?.avg_time_seconds ?? undefined,
      overallAvgScorePercent,
      trendAttempts: trendResult.rows.map((r) => ({
        attemptNumber: r.attempt_num,
        scorePercent: Math.round(r.score_percent * 10) / 10,
      })),
      bloomBreakdown,
      sectionBreakdown,
      difficultyBreakdown,
      streakAboveTarget: profile?.streak_above_target ?? 0,
      mostImprovedCategory: profile?.most_improved_category ?? undefined,
      growthDeltaPercent: profile?.growth_delta_percent ?? undefined,
      regressionFlag: profile?.regression_flag ?? false,
      stalledFlag: profile?.stalled_flag ?? false,
      bestScorePercent: profile?.best_score_percent ?? undefined,
      firstAttemptScorePercent: profile?.first_attempt_score_pct ?? undefined,
      recommendations: activeRecommendations,
    };
  }

  async educatorCourseOverview(courseId: string) {
    const [
      totals,
      bloomCoverageRows,
      sectionRows,
      bloomDifficultyRows,
      interventionRows,
    ] = await Promise.all([
      this.postgres.query<{
        total_students: number;
        total_questions: number;
        average_practice_quiz_percent: number | null;
      }>(
        `SELECT
           (
             SELECT count(*)::int
             FROM enrollments e
             JOIN enrollment_statuses es
               ON es.enrollment_status_id = e.enrollment_status_id
             WHERE e.course_id = $1 AND es.status_code = 'active'
           ) AS total_students,
           (
             SELECT count(*)::int
             FROM questions q
             JOIN course_sections cs ON cs.id = q.course_section_id
             JOIN question_statuses qs ON qs.question_status_id = q.question_status_id
             WHERE cs.course_id = $1 AND qs.status_code = 'active'
           ) AS total_questions,
           (
             SELECT avg(
               CASE
                 WHEN scp.questions_answered > 0
                 THEN (scp.correct_count::float / scp.questions_answered::float) * 100
                 ELSE NULL
               END
             )
             FROM student_course_profile scp
             WHERE scp.course_id = $1
           ) AS average_practice_quiz_percent`,
        [courseId],
      ),
      this.postgres.query<{
        level_name: string;
        coverage_count: number;
        performance_percent: number | null;
      }>(
        `SELECT
           bl.level_name,
           coalesce(coverage.coverage_count, 0)::int AS coverage_count,
           performance.performance_percent
         FROM bloom_levels bl
         LEFT JOIN (
           SELECT
             q.bloom_level_id,
             count(*)::int AS coverage_count
           FROM questions q
           JOIN course_sections cs ON cs.id = q.course_section_id
           JOIN question_statuses qs ON qs.question_status_id = q.question_status_id
           WHERE cs.course_id = $1 AND qs.status_code = 'active'
           GROUP BY q.bloom_level_id
         ) coverage ON coverage.bloom_level_id = bl.bloom_level_id
         LEFT JOIN (
           SELECT
             sbm.bloom_level_id,
             CASE
               WHEN sum(sbm.questions_answered) > 0
               THEN round(
                 (sum(sbm.correct_count)::numeric / sum(sbm.questions_answered)::numeric) * 100
               )::float
               ELSE NULL
             END AS performance_percent
           FROM student_bloom_mastery sbm
           WHERE sbm.course_id = $1
           GROUP BY sbm.bloom_level_id
         ) performance ON performance.bloom_level_id = bl.bloom_level_id
         ORDER BY bl.level_rank`,
        [courseId],
      ),
      this.postgres.query<{
        section_name: string;
        question_count: number;
      }>(
        `SELECT
           cs.title AS section_name,
           count(q.id) FILTER (WHERE qs.status_code = 'active')::int AS question_count
         FROM course_sections cs
         LEFT JOIN questions q ON q.course_section_id = cs.id
         LEFT JOIN question_statuses qs ON qs.question_status_id = q.question_status_id
         WHERE cs.course_id = $1
         GROUP BY cs.id, cs.title, cs.position
         ORDER BY cs.position, cs.title`,
        [courseId],
      ),
      this.postgres.query<{
        level_name: string;
        easy_count: number;
        medium_count: number;
        hard_count: number;
      }>(
        `SELECT
           bl.level_name,
           coalesce(counts.easy_count, 0)::int AS easy_count,
           coalesce(counts.medium_count, 0)::int AS medium_count,
           coalesce(counts.hard_count, 0)::int AS hard_count
         FROM bloom_levels bl
         LEFT JOIN (
           SELECT
             q.bloom_level_id,
             count(*) FILTER (WHERE dl.level_name = 'Easy')::int AS easy_count,
             count(*) FILTER (WHERE dl.level_name = 'Medium')::int AS medium_count,
             count(*) FILTER (
               WHERE dl.level_name IN ('Hard', 'Expert')
             )::int AS hard_count
           FROM questions q
           JOIN course_sections cs ON cs.id = q.course_section_id
           JOIN question_statuses qs ON qs.question_status_id = q.question_status_id
           JOIN difficulty_levels dl
             ON dl.difficulty_level_id = q.difficulty_level_id
           WHERE cs.course_id = $1 AND qs.status_code = 'active'
           GROUP BY q.bloom_level_id
         ) counts ON counts.bloom_level_id = bl.bloom_level_id
         ORDER BY bl.level_rank`,
        [courseId],
      ),
      this.postgres.query<{
        rule_label: string;
        flagged_student_count: number;
      }>(
        `SELECT
           r.rule_name AS rule_label,
           count(DISTINCT f.user_id)::int AS flagged_student_count
         FROM intervention_flags f
         JOIN intervention_rules r ON r.id = f.rule_id
         JOIN intervention_flag_statuses s
           ON s.intervention_flag_status_id = f.intervention_flag_status_id
         WHERE f.course_id = $1 AND s.status_code = 'open'
         GROUP BY r.id, r.rule_name
         ORDER BY flagged_student_count DESC, r.rule_name`,
        [courseId],
      ),
    ]);

    const totalsRow = totals.rows[0];
    const averagePracticeQuizPercent =
      totalsRow === undefined || totalsRow.average_practice_quiz_percent === null
        ? 0
        : Math.round(totalsRow.average_practice_quiz_percent);

    return {
      courseId,
      totalStudents: totalsRow === undefined ? 0 : totalsRow.total_students,
      averagePracticeQuizPercent,
      totalQuestions: totalsRow === undefined ? 0 : totalsRow.total_questions,
      bloomCoverage: bloomCoverageRows.rows.map((row) => ({
        levelName: row.level_name,
        coverageCount: row.coverage_count,
        performancePercent:
          row.performance_percent === null ? 0 : Math.round(row.performance_percent),
      })),
      questionSections: sectionRows.rows.map((row) => ({
        sectionName: row.section_name,
        questionCount: row.question_count,
      })),
      bloomDifficulty: bloomDifficultyRows.rows.map((row) => ({
        levelName: row.level_name,
        easyCount: row.easy_count,
        mediumCount: row.medium_count,
        hardCount: row.hard_count,
      })),
      interventionRuleFlags: interventionRows.rows.map((row) => ({
        ruleLabel: row.rule_label,
        flaggedStudentCount: row.flagged_student_count,
      })),
    };
  }

  async educatorCoursePracticeInsights(courseId: string) {
    const [attemptRows, questionSuccessRows] = await Promise.all([
      this.postgres.query<{
        attempt_id: string;
        user_id: string;
        full_name: string;
        attempt_number: number;
        score_percent: number;
      }>(
        `WITH scored_attempts AS (
           SELECT
             qa.id AS attempt_id,
             qa.user_id,
             coalesce(nullif(trim(u.full_name), ''), u.email) AS full_name,
             qa.completed_at,
             qa.generated_at,
             CASE
               WHEN count(qai.id) > 0
               THEN round(
                 (
                   count(qai.id) FILTER (WHERE qai.is_correct IS TRUE)::numeric
                   / count(qai.id)::numeric
                 ) * 100
               )::float
               ELSE NULL
             END AS score_percent
           FROM quiz_attempts qa
           JOIN quiz_attempt_statuses st
             ON st.quiz_attempt_status_id = qa.quiz_attempt_status_id
           JOIN users u ON u.id = qa.user_id
           LEFT JOIN quiz_attempt_items qai ON qai.quiz_attempt_id = qa.id
           WHERE qa.course_id = $1 AND st.status_code = 'completed'
           GROUP BY
             qa.id,
             qa.user_id,
             u.full_name,
             u.email,
             qa.completed_at,
             qa.generated_at
         ),
         ranked AS (
           SELECT
             attempt_id,
             user_id,
             full_name,
             score_percent,
             row_number() OVER (
               PARTITION BY user_id
               ORDER BY completed_at ASC NULLS LAST, generated_at ASC
             )::int AS attempt_number
           FROM scored_attempts
           WHERE score_percent IS NOT NULL
         )
         SELECT attempt_id, user_id, full_name, attempt_number, score_percent
         FROM ranked
         ORDER BY user_id, attempt_number`,
        [courseId],
      ),
      this.postgres.query<{
        question_id: string;
        prompt: string;
        status: string;
        section_title: string;
        times_answered: number;
        times_correct: number;
      }>(
        `SELECT
           q.id AS question_id,
           q.prompt,
           qs.status_code AS status,
           cs.title AS section_title,
           count(*) FILTER (WHERE qai.is_correct IS NOT NULL)::int AS times_answered,
           count(*) FILTER (WHERE qai.is_correct IS TRUE)::int AS times_correct
         FROM questions q
         JOIN course_sections cs ON cs.id = q.course_section_id
         JOIN question_statuses qs ON qs.question_status_id = q.question_status_id
         JOIN quiz_attempt_items qai ON qai.question_id = q.id
         JOIN quiz_attempts qa ON qa.id = qai.quiz_attempt_id
         JOIN quiz_attempt_statuses st
           ON st.quiz_attempt_status_id = qa.quiz_attempt_status_id
         WHERE cs.course_id = $1
           AND st.status_code = 'completed'
           AND qai.is_correct IS NOT NULL
         GROUP BY q.id, q.prompt, qs.status_code, cs.title, cs.position
         HAVING count(*) FILTER (WHERE qai.is_correct IS NOT NULL) > 0
         ORDER BY cs.position, q.prompt`,
        [courseId],
      ),
    ]);

    return buildEducatorPracticeInsights(
      attemptRows.rows,
      questionSuccessRows.rows,
    );
  }
}

type PracticeAttemptRow = {
  attempt_id: string;
  user_id: string;
  full_name: string;
  attempt_number: number;
  score_percent: number;
};

type StudentAttemptScore = {
  attemptNumber: number;
  scorePercent: number;
};

type StudentPracticeSeries = {
  userId: string;
  fullName: string;
  attemptScores: StudentAttemptScore[];
  meanPercent: number;
};

const PRACTICE_ATTEMPT_LIMIT = 6;
const QUESTION_TOO_EASY_SUCCESS_PERCENT = 95;
const QUESTION_TOO_HARD_SUCCESS_PERCENT = 30;
const QUESTION_FLAG_MIN_ANSWERS = 3;
const QUESTION_PROMPT_PREVIEW_LENGTH = 72;
const IDEAL_SCORE_MEAN_PERCENT = 70;
const IDEAL_SCORE_STANDARD_DEVIATION = 15;

type QuestionSuccessRow = {
  question_id: string;
  prompt: string;
  status: string;
  section_title: string;
  times_answered: number;
  times_correct: number;
};

type QuestionSuccessFlag = 'too_easy' | 'too_hard' | 'balanced' | 'insufficient_data';

type QuestionSuccessStat = {
  questionId: string;
  promptPreview: string;
  sectionTitle: string;
  status: string;
  timesAnswered: number;
  successRatePercent: number;
  flag: QuestionSuccessFlag;
};

function meanOfNumbers(values: number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }
  let total = 0;
  for (const value of values) {
    total += value;
  }
  return total / values.length;
}

function populationStandardDeviation(values: number[]): number | undefined {
  const mean = meanOfNumbers(values);
  if (mean === undefined || values.length < 2) {
    return undefined;
  }
  let squaredDifferenceTotal = 0;
  for (const value of values) {
    const difference = value - mean;
    squaredDifferenceTotal += difference * difference;
  }
  return Math.sqrt(squaredDifferenceTotal / values.length);
}

function roundPercent(value: number): number {
  return Math.round(value);
}

function buildStudentSeries(
  rows: PracticeAttemptRow[],
): StudentPracticeSeries[] {
  const studentsById = new Map<string, StudentPracticeSeries>();

  for (const row of rows) {
    let student = studentsById.get(row.user_id);
    if (student === undefined) {
      student = {
        userId: row.user_id,
        fullName: row.full_name,
        attemptScores: [],
        meanPercent: 0,
      };
      studentsById.set(row.user_id, student);
    }
    student.attemptScores.push({
      attemptNumber: row.attempt_number,
      scorePercent: roundPercent(row.score_percent),
    });
  }

  const students: StudentPracticeSeries[] = [];
  for (const student of studentsById.values()) {
    const scores = student.attemptScores.map(
      (attempt) => attempt.scorePercent,
    );
    const mean = meanOfNumbers(scores);
    if (mean === undefined) {
      continue;
    }
    student.meanPercent = mean;
    students.push(student);
  }
  return students;
}

function buildAttemptAverages(students: StudentPracticeSeries[]) {
  const attemptAverages: Array<{
    attemptNumber: number;
    averagePercent: number;
    studentCount: number;
  }> = [];

  for (
    let attemptNumber = 1;
    attemptNumber <= PRACTICE_ATTEMPT_LIMIT;
    attemptNumber += 1
  ) {
    const scoresForAttempt: number[] = [];
    for (const student of students) {
      for (const attempt of student.attemptScores) {
        if (attempt.attemptNumber === attemptNumber) {
          scoresForAttempt.push(attempt.scorePercent);
        }
      }
    }
    const average = meanOfNumbers(scoresForAttempt);
    if (average === undefined) {
      continue;
    }
    attemptAverages.push({
      attemptNumber,
      averagePercent: roundPercent(average),
      studentCount: scoresForAttempt.length,
    });
  }

  return attemptAverages;
}

function buildOutliers(students: StudentPracticeSeries[]) {
  const means = students.map((student) => student.meanPercent);
  const classMean = meanOfNumbers(means);
  const standardDeviation = populationStandardDeviation(means);
  if (
    classMean === undefined ||
    standardDeviation === undefined ||
    standardDeviation === 0
  ) {
    return [];
  }

  const lowerBound = classMean - 2 * standardDeviation;
  const upperBound = classMean + 2 * standardDeviation;
  const outliers: Array<{
    userId: string;
    fullName: string;
    meanPercent: number;
    direction: 'above' | 'below';
    attemptScores: StudentAttemptScore[];
  }> = [];

  for (const student of students) {
    if (student.meanPercent < lowerBound) {
      outliers.push({
        userId: student.userId,
        fullName: student.fullName,
        meanPercent: roundPercent(student.meanPercent),
        direction: 'below',
        attemptScores: student.attemptScores.filter(
          (attempt) => attempt.attemptNumber <= PRACTICE_ATTEMPT_LIMIT,
        ),
      });
    } else if (student.meanPercent > upperBound) {
      outliers.push({
        userId: student.userId,
        fullName: student.fullName,
        meanPercent: roundPercent(student.meanPercent),
        direction: 'above',
        attemptScores: student.attemptScores.filter(
          (attempt) => attempt.attemptNumber <= PRACTICE_ATTEMPT_LIMIT,
        ),
      });
    }
  }

  return outliers;
}

function normalDensity(scorePercent: number, mean: number, sd: number) {
  const coefficient = 1 / (sd * Math.sqrt(2 * Math.PI));
  const standardized = (scorePercent - mean) / sd;
  return coefficient * Math.exp(-0.5 * standardized * standardized);
}

function buildDensityCurve(
  studentMeans: number[],
  classMeanPercent: number | undefined,
  standardDeviation: number | undefined,
) {
  if (classMeanPercent === undefined || studentMeans.length === 0) {
    return [];
  }

  const densityCurve: Array<{ scorePercent: number; density: number }> = [];

  if (
    standardDeviation === undefined ||
    standardDeviation === 0 ||
    studentMeans.length < 2
  ) {
    const peakScore = roundPercent(classMeanPercent);
    for (let scorePercent = 0; scorePercent <= 100; scorePercent += 1) {
      const distance = Math.abs(scorePercent - peakScore);
      let density = 0;
      if (distance === 0) {
        density = 1;
      } else if (distance === 1) {
        density = 0.35;
      } else if (distance === 2) {
        density = 0.1;
      }
      densityCurve.push({ scorePercent, density });
    }
    return densityCurve;
  }

  let peakDensity = 0;
  for (let scorePercent = 0; scorePercent <= 100; scorePercent += 1) {
    const density = normalDensity(
      scorePercent,
      classMeanPercent,
      standardDeviation,
    );
    if (density > peakDensity) {
      peakDensity = density;
    }
    densityCurve.push({ scorePercent, density });
  }

  if (peakDensity > 0) {
    for (const point of densityCurve) {
      point.density = Math.round((point.density / peakDensity) * 1000) / 1000;
    }
  }

  return densityCurve;
}

function buildIdealDensityCurve() {
  const densityCurve: Array<{ scorePercent: number; density: number }> = [];
  let peakDensity = 0;

  for (let scorePercent = 0; scorePercent <= 100; scorePercent += 1) {
    const density = normalDensity(
      scorePercent,
      IDEAL_SCORE_MEAN_PERCENT,
      IDEAL_SCORE_STANDARD_DEVIATION,
    );
    if (density > peakDensity) {
      peakDensity = density;
    }
    densityCurve.push({ scorePercent, density });
  }

  if (peakDensity > 0) {
    for (const point of densityCurve) {
      point.density = Math.round((point.density / peakDensity) * 1000) / 1000;
    }
  }

  return densityCurve;
}

function buildAttemptInsights(
  attemptAverages: Array<{
    attemptNumber: number;
    averagePercent: number;
    studentCount: number;
  }>,
  students: StudentPracticeSeries[],
  courseWideAveragePercent: number | undefined,
) {
  if (attemptAverages.length === 0) {
    return [
      'No completed practice quiz attempts yet. Insights will appear once learners finish quizzes.',
    ];
  }

  const insights: string[] = [];
  const firstAverage = attemptAverages[0];
  const lastAverage = attemptAverages[attemptAverages.length - 1];
  if (firstAverage !== undefined && lastAverage !== undefined) {
    const delta =
      lastAverage.averagePercent - firstAverage.averagePercent;
    if (delta >= 5) {
      insights.push(
        `Class average improved from ${firstAverage.averagePercent}% on attempt ${firstAverage.attemptNumber} to ${lastAverage.averagePercent}% on attempt ${lastAverage.attemptNumber}. More practice appears to help.`,
      );
    } else if (delta <= -5) {
      insights.push(
        `Class average declined from ${firstAverage.averagePercent}% on attempt ${firstAverage.attemptNumber} to ${lastAverage.averagePercent}% on attempt ${lastAverage.attemptNumber}. Review early content or quiz difficulty.`,
      );
    } else {
      insights.push(
        `Class average stayed roughly flat across attempts (${firstAverage.averagePercent}% → ${lastAverage.averagePercent}%). Learners may need targeted remediation rather than more volume alone.`,
      );
    }
  }

  let studentsWithMultipleAttempts = 0;
  for (const student of students) {
    if (student.attemptScores.length >= 2) {
      studentsWithMultipleAttempts += 1;
    }
  }
  if (students.length > 0) {
    const share = roundPercent(
      (studentsWithMultipleAttempts / students.length) * 100,
    );
    insights.push(
      `${studentsWithMultipleAttempts} of ${students.length} learners (${share}%) completed at least two practice quizzes.`,
    );
  }

  if (courseWideAveragePercent !== undefined) {
    insights.push(
      `Across all completed attempts, the course-wide average score is ${courseWideAveragePercent}%.`,
    );
  }

  return insights;
}

function buildOutlierInsights(
  outliers: Array<{
    fullName: string;
    meanPercent: number;
    direction: 'above' | 'below';
    attemptScores: StudentAttemptScore[];
  }>,
  classMeanPercent: number | undefined,
) {
  if (outliers.length === 0) {
    return [
      'No learners sit outside two standard deviations of the class mean yet. Outlier trajectories will appear here when someone is unusually high or low.',
    ];
  }

  const insights: string[] = [];
  let belowCount = 0;
  let aboveCount = 0;
  for (const outlier of outliers) {
    if (outlier.direction === 'below') {
      belowCount += 1;
    } else {
      aboveCount += 1;
    }
  }

  const classMeanLabel =
    classMeanPercent === undefined
      ? 'the class mean'
      : `the class mean (${classMeanPercent}%)`;

  insights.push(
    `${outliers.length} learner${outliers.length === 1 ? '' : 's'} sit outside ±2 SD of ${classMeanLabel}: ${belowCount} below, ${aboveCount} above.`,
  );

  for (const outlier of outliers) {
    const attemptCount = outlier.attemptScores.length;
    if (outlier.direction === 'below') {
      insights.push(
        `${outlier.fullName} averages ${outlier.meanPercent}% across ${attemptCount} attempt${attemptCount === 1 ? '' : 's'} — well below the cohort. Check early quiz results, missing section work, or open intervention flags, and consider a short check-in.`,
      );
    } else {
      insights.push(
        `${outlier.fullName} averages ${outlier.meanPercent}% across ${attemptCount} attempt${attemptCount === 1 ? '' : 's'} — well above the cohort. Offer stretch practice or peer-support roles so they stay engaged.`,
      );
    }
  }

  return insights;
}

type CourseGrowthHighlight = {
  type: 'progress' | 'consistency' | 'momentum' | 'honesty';
  title: string;
  description: string;
};

function meanOfAttemptSlice(
  scores: StudentAttemptScore[],
  startIndex: number,
  endIndexExclusive: number,
): number | undefined {
  const slice: number[] = [];
  for (let index = startIndex; index < endIndexExclusive; index += 1) {
    const attempt = scores[index];
    if (attempt !== undefined) {
      slice.push(attempt.scorePercent);
    }
  }
  return meanOfNumbers(slice);
}

function buildCourseGrowthHighlights(
  students: StudentPracticeSeries[],
  attemptAverages: Array<{
    attemptNumber: number;
    averagePercent: number;
    studentCount: number;
  }>,
  classMeanPercent: number | undefined,
): CourseGrowthHighlight[] {
  if (students.length === 0) {
    return [];
  }

  const list: CourseGrowthHighlight[] = [];
  let totalAttempts = 0;
  let learnersWithMultipleAttempts = 0;
  let learnersImproved = 0;
  let learnersRegressed = 0;
  let learnersAboveTarget = 0;
  let bestLearnerMean = 0;

  for (const student of students) {
    totalAttempts += student.attemptScores.length;
    if (student.meanPercent >= 70) {
      learnersAboveTarget += 1;
    }
    if (student.meanPercent > bestLearnerMean) {
      bestLearnerMean = student.meanPercent;
    }

    if (student.attemptScores.length >= 2) {
      learnersWithMultipleAttempts += 1;
      const first = student.attemptScores[0];
      const last = student.attemptScores[student.attemptScores.length - 1];
      if (first !== undefined && last !== undefined) {
        if (last.scorePercent > first.scorePercent + 5) {
          learnersImproved += 1;
        }
        if (last.scorePercent < first.scorePercent - 5) {
          learnersRegressed += 1;
        }
      }
    }
  }

  let recentDipCount = 0;
  for (const student of students) {
    if (student.attemptScores.length < 4) {
      continue;
    }
    const midpoint = Math.floor(student.attemptScores.length / 2);
    const earlyMean = meanOfAttemptSlice(student.attemptScores, 0, midpoint);
    const lateMean = meanOfAttemptSlice(
      student.attemptScores,
      student.attemptScores.length - 3,
      student.attemptScores.length,
    );
    if (
      earlyMean !== undefined &&
      lateMean !== undefined &&
      lateMean < earlyMean - 5
    ) {
      recentDipCount += 1;
    }
  }

  // --- Honesty ---
  if (recentDipCount >= 2 || (students.length >= 3 && recentDipCount / students.length >= 0.3)) {
    list.push({
      type: 'honesty',
      title: 'Recent scores have dipped for several learners',
      description: `${recentDipCount} learner${recentDipCount === 1 ? '' : 's'} scored lower on recent quizzes than earlier ones. Check weak sections and whether later attempts are harder.`,
    });
  } else if (
    learnersWithMultipleAttempts >= 3 &&
    learnersRegressed >= Math.ceil(learnersWithMultipleAttempts * 0.4)
  ) {
    list.push({
      type: 'honesty',
      title: 'More learners finishing below where they started',
      description: `${learnersRegressed} of ${learnersWithMultipleAttempts} learners with multiple attempts ended lower than attempt 1. Review early content or quiz difficulty.`,
    });
  }

  // --- Progress ---
  const firstAverage = attemptAverages[0];
  const lastAverage = attemptAverages[attemptAverages.length - 1];
  if (
    firstAverage !== undefined &&
    lastAverage !== undefined &&
    attemptAverages.length >= 2 &&
    lastAverage.attemptNumber > firstAverage.attemptNumber
  ) {
    const delta = lastAverage.averagePercent - firstAverage.averagePercent;
    if (delta >= 5) {
      list.push({
        type: 'progress',
        title: `+${delta} points class average since attempt ${firstAverage.attemptNumber}`,
        description: `Cohort average moved from ${firstAverage.averagePercent}% to ${lastAverage.averagePercent}% by attempt ${lastAverage.attemptNumber}. Practice volume is paying off.`,
      });
    } else if (delta <= -5) {
      if (list.every((highlight) => highlight.type !== 'honesty')) {
        list.push({
          type: 'honesty',
          title: 'Class average has slipped across attempts',
          description: `Average fell from ${firstAverage.averagePercent}% on attempt ${firstAverage.attemptNumber} to ${lastAverage.averagePercent}% on attempt ${lastAverage.attemptNumber}.`,
        });
      }
    }
  }

  if (
    learnersWithMultipleAttempts >= 3 &&
    learnersImproved >= Math.ceil(learnersWithMultipleAttempts * 0.4)
  ) {
    const improvedShare = roundPercent(
      (learnersImproved / learnersWithMultipleAttempts) * 100,
    );
    list.push({
      type: 'progress',
      title: `${improvedShare}% of active learners improved`,
      description: `${learnersImproved} of ${learnersWithMultipleAttempts} learners with multiple attempts scored higher on their latest quiz than their first.`,
    });
  }

  // --- Consistency ---
  if (learnersAboveTarget >= 2 && classMeanPercent !== undefined) {
    const aboveShare = roundPercent(
      (learnersAboveTarget / students.length) * 100,
    );
    if (classMeanPercent >= 70 || aboveShare >= 40) {
      list.push({
        type: 'consistency',
        title: `${learnersAboveTarget} learner${learnersAboveTarget === 1 ? '' : 's'} averaging ≥70%`,
        description: `${aboveShare}% of the cohort sits at or above the 70% target across their practice attempts.`,
      });
    }
  } else if (classMeanPercent !== undefined && classMeanPercent >= 70) {
    list.push({
      type: 'consistency',
      title: `${classMeanPercent}% class average`,
      description:
        'The cohort mean is at or above the 70% target — solid, sustained performance overall.',
    });
  }

  // --- Momentum ---
  let peakAttempt:
    | { attemptNumber: number; averagePercent: number; studentCount: number }
    | undefined;
  for (const attemptAverage of attemptAverages) {
    if (
      peakAttempt === undefined ||
      attemptAverage.averagePercent > peakAttempt.averagePercent
    ) {
      peakAttempt = attemptAverage;
    }
  }
  if (
    peakAttempt !== undefined &&
    peakAttempt.averagePercent >= 70 &&
    peakAttempt.studentCount >= 2
  ) {
    list.push({
      type: 'momentum',
      title: `${peakAttempt.averagePercent}% peak on attempt ${peakAttempt.attemptNumber}`,
      description: `That is the strongest class average so far (${peakAttempt.studentCount} learners). Aim to make it the new floor, not a one-off spike.`,
    });
  } else if (bestLearnerMean >= 70) {
    list.push({
      type: 'momentum',
      title: `${roundPercent(bestLearnerMean)}% top learner average`,
      description:
        'At least one learner is averaging at or above the 70% target. Use their trajectory as a stretch reference for the rest of the class.',
    });
  }

  // --- Honesty fallback ---
  if (list.every((highlight) => highlight.type !== 'honesty')) {
    if (totalAttempts < 8 || students.length < 3) {
      list.push({
        type: 'honesty',
        title: 'Still early for the cohort',
        description:
          'With limited completed attempts, cohort trends are noisy. Growth highlights get clearer as more learners finish quizzes.',
      });
    } else {
      list.push({
        type: 'honesty',
        title: 'Scores naturally vary across learners',
        description:
          'Quiz-to-quiz and learner-to-learner variation is normal — watch the class trend and outliers together rather than any single result.',
      });
    }
  }

  return list.slice(0, 4);
}

function buildDistributionInsights(
  studentCount: number,
  classMeanPercent: number | undefined,
  standardDeviation: number | undefined,
  studentMeans: number[],
) {
  if (studentCount === 0 || classMeanPercent === undefined) {
    return [
      'No learner averages to chart yet. A distribution appears after completed practice quizzes.',
    ];
  }

  const insights: string[] = [
    `Class mean practice score across learners is ${roundPercent(classMeanPercent)}% (${studentCount} learners with completed attempts).`,
  ];

  if (standardDeviation === undefined || studentCount < 2) {
    insights.push(
      'Need at least two learners with completed attempts to describe spread.',
    );
    return insights;
  }

  const roundedSd = Math.round(standardDeviation * 10) / 10;
  if (standardDeviation < 8) {
    insights.push(
      `Scores are tightly clustered (SD ${roundedSd}). Most of the class performs similarly.`,
    );
  } else if (standardDeviation > 20) {
    insights.push(
      `Scores are widely spread (SD ${roundedSd}). Consider differentiated support for lower performers.`,
    );
  } else {
    insights.push(
      `Score spread is moderate (SD ${roundedSd}).`,
    );
  }

  let belowFiftyCount = 0;
  for (const mean of studentMeans) {
    if (mean < 50) {
      belowFiftyCount += 1;
    }
  }
  const belowFiftyShare = roundPercent(
    (belowFiftyCount / studentMeans.length) * 100,
  );
  insights.push(
    `${belowFiftyCount} learners (${belowFiftyShare}%) average below 50% across their practice attempts.`,
  );

  const meanGap = roundPercent(classMeanPercent) - IDEAL_SCORE_MEAN_PERCENT;
  if (meanGap >= 8) {
    insights.push(
      `Class mean sits ${meanGap} points above the ideal reference peak (${IDEAL_SCORE_MEAN_PERCENT}%). Strong cohort performance relative to the target curve.`,
    );
  } else if (meanGap <= -8) {
    insights.push(
      `Class mean sits ${Math.abs(meanGap)} points below the ideal reference peak (${IDEAL_SCORE_MEAN_PERCENT}%). Compare the solid class curve to the dotted ideal on the chart.`,
    );
  } else {
    insights.push(
      `Class mean is close to the ideal reference peak (${IDEAL_SCORE_MEAN_PERCENT}%, SD ${IDEAL_SCORE_STANDARD_DEVIATION}). Use the dotted curve as a visual target.`,
    );
  }

  return insights;
}

function truncatePrompt(prompt: string): string {
  const trimmed = prompt.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= QUESTION_PROMPT_PREVIEW_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, QUESTION_PROMPT_PREVIEW_LENGTH - 1)}…`;
}

function questionSuccessFlag(
  successRatePercent: number,
  timesAnswered: number,
): QuestionSuccessFlag {
  if (timesAnswered < QUESTION_FLAG_MIN_ANSWERS) {
    return 'insufficient_data';
  }
  if (successRatePercent > QUESTION_TOO_EASY_SUCCESS_PERCENT) {
    return 'too_easy';
  }
  if (successRatePercent < QUESTION_TOO_HARD_SUCCESS_PERCENT) {
    return 'too_hard';
  }
  return 'balanced';
}

function buildQuestionSuccess(rows: QuestionSuccessRow[]) {
  const questions: QuestionSuccessStat[] = [];

  for (const row of rows) {
    if (row.times_answered <= 0) {
      continue;
    }
    const successRatePercent = roundPercent(
      (row.times_correct / row.times_answered) * 100,
    );
    questions.push({
      questionId: row.question_id,
      promptPreview: truncatePrompt(row.prompt),
      sectionTitle: row.section_title,
      status: row.status,
      timesAnswered: row.times_answered,
      successRatePercent,
      flag: questionSuccessFlag(successRatePercent, row.times_answered),
    });
  }

  questions.sort((left, right) => {
    if (left.successRatePercent !== right.successRatePercent) {
      return left.successRatePercent - right.successRatePercent;
    }
    return left.promptPreview.localeCompare(right.promptPreview);
  });

  let tooEasyCount = 0;
  let tooHardCount = 0;
  for (const question of questions) {
    if (question.flag === 'too_easy') {
      tooEasyCount += 1;
    }
    if (question.flag === 'too_hard') {
      tooHardCount += 1;
    }
  }

  return {
    questions,
    tooEasyCount,
    tooHardCount,
    answeredQuestionCount: questions.length,
  };
}

function buildQuestionSuccessInsights(
  questionSuccess: ReturnType<typeof buildQuestionSuccess>,
) {
  if (questionSuccess.answeredQuestionCount === 0) {
    return [
      'No answered practice questions yet. Success-rate insights appear after learners complete quizzes.',
    ];
  }

  const insights: string[] = [
    `${questionSuccess.answeredQuestionCount} questions have been answered in completed practice quizzes.`,
  ];

  if (questionSuccess.tooEasyCount === 0) {
    insights.push(
      `No active patterns above ${QUESTION_TOO_EASY_SUCCESS_PERCENT}% success (min ${QUESTION_FLAG_MIN_ANSWERS} answers).`,
    );
  } else {
    insights.push(
      `${questionSuccess.tooEasyCount} question(s) exceed ${QUESTION_TOO_EASY_SUCCESS_PERCENT}% success. Open the High success filter for the full list and deactivation guidance.`,
    );
  }

  if (questionSuccess.tooHardCount === 0) {
    insights.push(
      `No questions below ${QUESTION_TOO_HARD_SUCCESS_PERCENT}% success (min ${QUESTION_FLAG_MIN_ANSWERS} answers).`,
    );
  } else {
    insights.push(
      `${questionSuccess.tooHardCount} question(s) sit under ${QUESTION_TOO_HARD_SUCCESS_PERCENT}% success. Open the Needs revision filter for the full list and suggested actions.`,
    );
  }

  return insights;
}

function buildEducatorPracticeInsights(
  rows: PracticeAttemptRow[],
  questionSuccessRows: QuestionSuccessRow[],
) {
  const students = buildStudentSeries(rows);
  const allAttemptScores: number[] = [];
  for (const student of students) {
    for (const attempt of student.attemptScores) {
      allAttemptScores.push(attempt.scorePercent);
    }
  }

  const courseWideMean = meanOfNumbers(allAttemptScores);
  const courseWideAveragePercent =
    courseWideMean === undefined ? undefined : roundPercent(courseWideMean);

  const attemptAverages = buildAttemptAverages(students);
  const outliers = buildOutliers(students);

  const studentMeans = students.map((student) => student.meanPercent);
  const classMean = meanOfNumbers(studentMeans);
  const standardDeviation = populationStandardDeviation(studentMeans);
  const classMeanPercent =
    classMean === undefined ? undefined : roundPercent(classMean);

  const densityCurve = buildDensityCurve(
    studentMeans,
    classMean,
    standardDeviation,
  );
  const idealDensityCurve = buildIdealDensityCurve();

  const questionSuccess = buildQuestionSuccess(questionSuccessRows);

  return {
    attemptProgress: {
      courseWideAveragePercent,
      attemptAverages,
      outliers,
    },
    scoreDistribution: {
      studentCount: students.length,
      classMeanPercent,
      standardDeviation:
        standardDeviation === undefined
          ? undefined
          : Math.round(standardDeviation * 10) / 10,
      densityCurve,
      idealDensityCurve,
      idealMeanPercent: IDEAL_SCORE_MEAN_PERCENT,
      idealStandardDeviation: IDEAL_SCORE_STANDARD_DEVIATION,
    },
    questionSuccess,
    attemptInsights: buildAttemptInsights(
      attemptAverages,
      students,
      courseWideAveragePercent,
    ),
    outlierInsights: buildOutlierInsights(outliers, classMeanPercent),
    growthHighlights: buildCourseGrowthHighlights(
      students,
      attemptAverages,
      classMeanPercent,
    ),
    distributionInsights: buildDistributionInsights(
      students.length,
      classMeanPercent,
      standardDeviation,
      studentMeans,
    ),
    questionSuccessInsights: buildQuestionSuccessInsights(questionSuccess),
  };
}
