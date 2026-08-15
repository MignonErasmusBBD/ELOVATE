import { Injectable } from '@nestjs/common';
import { dateFromDatabase, SqlParameter, whereClause } from '../helpers/values';
import { PostgresService } from '../services/postgres.service';

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
  constructor(private readonly postgres: PostgresService) {}

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
}
