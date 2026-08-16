-- Required enrolments are per person per course. due_at is optional unless required.
-- Draft is the authoring status for new courses (replaces creating as deactivated).

ALTER TABLE enrollments
    ADD COLUMN is_required boolean NOT NULL DEFAULT false,
    ADD COLUMN due_at timestamptz;

INSERT INTO course_statuses (course_status_id, status_code) VALUES
    (3, 'draft');
ALTER TABLE course_statuses ALTER COLUMN course_status_id RESTART WITH 4;

ALTER TABLE courses
    ALTER COLUMN course_status_id SET DEFAULT 3;
