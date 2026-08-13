-- V5__quiz_generation.sql
-- Practice quizzes are generated one-shot. quiz_topic_weights / quiz_difficulty_weights /
-- quiz_bloom_weights record what the generator targeted for a given attempt; the actual
-- selected questions land in quiz_attempt_items.

CREATE TABLE quiz_attempts (
    id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                  uuid NOT NULL REFERENCES users(id),
    course_id                uuid NOT NULL REFERENCES courses(id),
    generated_at             timestamptz NOT NULL DEFAULT now(),
    started_at               timestamptz,
    completed_at             timestamptz,
    quiz_attempt_status_id   smallint NOT NULL REFERENCES quiz_attempt_statuses(quiz_attempt_status_id),
    rating_at_generation     float NOT NULL,
    rating_at_completion     float
);
CREATE INDEX idx_quiz_attempts_user_course_generated
    ON quiz_attempts(user_id, course_id, generated_at DESC);

CREATE TABLE quiz_attempt_items (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_attempt_id      uuid NOT NULL REFERENCES quiz_attempts(id),
    question_id          uuid NOT NULL REFERENCES questions(id),
    selected_option_id   uuid REFERENCES question_options(id),
    is_correct           boolean,
    answered_at          timestamptz
);
CREATE INDEX idx_quiz_attempt_items_attempt_id ON quiz_attempt_items(quiz_attempt_id);
CREATE INDEX idx_quiz_attempt_items_question_id ON quiz_attempt_items(question_id);

CREATE TABLE quiz_topic_weights (
    quiz_attempt_id      uuid NOT NULL REFERENCES quiz_attempts(id),
    topic_id             uuid NOT NULL REFERENCES topics(id),
    target_weight        float NOT NULL,
    questions_allocated  int NOT NULL,
    PRIMARY KEY (quiz_attempt_id, topic_id)
);

CREATE TABLE quiz_difficulty_weights (
    quiz_attempt_id      uuid NOT NULL REFERENCES quiz_attempts(id),
    difficulty_level_id  smallint NOT NULL REFERENCES difficulty_levels(difficulty_level_id),
    target_weight        float NOT NULL,
    questions_allocated  int NOT NULL,
    PRIMARY KEY (quiz_attempt_id, difficulty_level_id)
);

CREATE TABLE quiz_bloom_weights (
    quiz_attempt_id      uuid NOT NULL REFERENCES quiz_attempts(id),
    bloom_level_id       smallint NOT NULL REFERENCES bloom_levels(bloom_level_id),
    target_weight        float NOT NULL,
    questions_allocated  int NOT NULL,
    PRIMARY KEY (quiz_attempt_id, bloom_level_id)
);
