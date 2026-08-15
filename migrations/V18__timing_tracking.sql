-- Per-question start time for quiz items
ALTER TABLE quiz_attempt_items
  ADD COLUMN question_started_at timestamptz;

-- Track time students spend reading course section content
CREATE TABLE content_view_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id         uuid NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  course_section_id uuid NOT NULL REFERENCES course_sections(id) ON DELETE CASCADE,
  viewed_at         timestamptz NOT NULL DEFAULT now(),
  duration_seconds  int NOT NULL CHECK (duration_seconds > 0)
);

CREATE INDEX idx_content_view_sessions_user_course
  ON content_view_sessions (user_id, course_id, viewed_at DESC);
