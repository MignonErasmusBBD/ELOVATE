-- V6__learning_profiles.sql
-- Materialised summaries, kept in sync from the application transaction that writes each
-- quiz_attempt_items row (or, at scale, an async worker off the write path) — not views,
-- not triggers by default. Rebuildable at any time by replaying quiz_attempt_items.

CREATE TABLE student_course_profile (
    user_id            uuid NOT NULL REFERENCES users(id),
    course_id          uuid NOT NULL REFERENCES courses(id),
    current_rating     float NOT NULL,
    questions_answered int NOT NULL DEFAULT 0,
    correct_count      int NOT NULL DEFAULT 0,
    last_answered_at   timestamptz,
    updated_at         timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, course_id)
);
CREATE INDEX idx_student_course_profile_course_id ON student_course_profile(course_id);

CREATE TABLE student_topic_mastery (
    user_id            uuid NOT NULL REFERENCES users(id),
    course_id          uuid NOT NULL REFERENCES courses(id),
    topic_id           uuid NOT NULL REFERENCES topics(id),
    questions_answered int NOT NULL DEFAULT 0,
    correct_count      int NOT NULL DEFAULT 0,
    updated_at         timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, course_id, topic_id)
);
CREATE INDEX idx_student_topic_mastery_topic_id ON student_topic_mastery(topic_id);

CREATE TABLE student_difficulty_mastery (
    user_id              uuid NOT NULL REFERENCES users(id),
    course_id            uuid NOT NULL REFERENCES courses(id),
    difficulty_level_id  smallint NOT NULL REFERENCES difficulty_levels(difficulty_level_id),
    questions_answered   int NOT NULL DEFAULT 0,
    correct_count        int NOT NULL DEFAULT 0,
    updated_at           timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, course_id, difficulty_level_id)
);

CREATE TABLE student_bloom_mastery (
    user_id            uuid NOT NULL REFERENCES users(id),
    course_id          uuid NOT NULL REFERENCES courses(id),
    bloom_level_id     smallint NOT NULL REFERENCES bloom_levels(bloom_level_id),
    questions_answered int NOT NULL DEFAULT 0,
    correct_count      int NOT NULL DEFAULT 0,
    updated_at         timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, course_id, bloom_level_id)
);

CREATE TABLE overall_learning_profile (
    user_id                    uuid PRIMARY KEY REFERENCES users(id),
    aggregate_rating           float NOT NULL,
    total_courses              int NOT NULL DEFAULT 0,
    total_questions_answered   int NOT NULL DEFAULT 0,
    updated_at                 timestamptz NOT NULL DEFAULT now()
);
