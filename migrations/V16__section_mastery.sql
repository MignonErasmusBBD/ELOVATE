-- V16__section_mastery.sql
-- Replace topic-based quiz mastery with course-section-based mastery.
-- Questions are already linked to exactly one course_section via questions.course_section_id,
-- so section mastery maps directly to what the student studied in the lesson.

CREATE TABLE student_section_mastery (
    user_id             uuid NOT NULL REFERENCES users(id),
    course_id           uuid NOT NULL REFERENCES courses(id),
    course_section_id   uuid NOT NULL REFERENCES course_sections(id),
    questions_answered  int NOT NULL DEFAULT 0,
    correct_count       int NOT NULL DEFAULT 0,
    updated_at          timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, course_id, course_section_id)
);
CREATE INDEX idx_student_section_mastery_section_id ON student_section_mastery(course_section_id);

CREATE TABLE quiz_section_weights (
    quiz_attempt_id     uuid NOT NULL REFERENCES quiz_attempts(id),
    course_section_id   uuid NOT NULL REFERENCES course_sections(id),
    target_weight       float NOT NULL,
    questions_allocated int NOT NULL,
    PRIMARY KEY (quiz_attempt_id, course_section_id)
);
