-- V21__student_dashboard_summary.sql
-- Extends student_course_profile with per-attempt summary columns and precomputed
-- growth-highlight flags for the student performance dashboard.
-- All columns are populated synchronously inside the quiz complete() transaction;
-- the dashboard endpoint does a plain read with no page-load recomputation.

ALTER TABLE student_course_profile
  ADD COLUMN total_attempts            int               NOT NULL DEFAULT 0,
  ADD COLUMN avg_score_percent         double precision,
  ADD COLUMN avg_time_seconds          double precision,
  ADD COLUMN best_score_percent        double precision,
  ADD COLUMN first_attempt_score_pct   double precision,
  ADD COLUMN streak_above_target       int               NOT NULL DEFAULT 0,
  ADD COLUMN most_improved_category    text,
  ADD COLUMN growth_delta_percent      double precision,
  ADD COLUMN regression_flag           boolean           NOT NULL DEFAULT false,
  ADD COLUMN stalled_flag              boolean           NOT NULL DEFAULT false;

-- Partial index for the last-10-attempts trend query (ORDER BY completed_at DESC LIMIT 10).
-- The WHERE clause excludes non-completed rows so the planner only scans completed attempts.
CREATE INDEX idx_quiz_attempts_user_course_completed
  ON quiz_attempts(user_id, course_id, completed_at DESC)
  WHERE completed_at IS NOT NULL;
