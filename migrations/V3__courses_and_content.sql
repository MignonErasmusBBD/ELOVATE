-- V3__courses_and_content.sql

CREATE TABLE courses (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owning_organization_id  uuid NOT NULL REFERENCES organizations(id),
    title                   varchar(255) NOT NULL,
    description             text,
    course_visibility_id    smallint NOT NULL REFERENCES course_visibilities(course_visibility_id),
    created_by              uuid NOT NULL REFERENCES users(id),
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_courses_owning_organization_id ON courses(owning_organization_id);
CREATE INDEX idx_courses_course_visibility_id ON courses(course_visibility_id);

CREATE TABLE course_sections (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL REFERENCES courses(id),
    title     varchar(255) NOT NULL,
    position  int NOT NULL
);
CREATE INDEX idx_course_sections_course_id ON course_sections(course_id);

CREATE TABLE topics (
    id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid NOT NULL REFERENCES courses(id),
    name      varchar(255) NOT NULL
);
CREATE INDEX idx_topics_course_id ON topics(course_id);

CREATE TABLE questions (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_section_id    uuid NOT NULL REFERENCES course_sections(id),
    question_format_id   smallint NOT NULL REFERENCES question_formats(question_format_id),
    prompt               text NOT NULL,
    bloom_level_id       smallint NOT NULL REFERENCES bloom_levels(bloom_level_id),
    difficulty_level_id  smallint NOT NULL REFERENCES difficulty_levels(difficulty_level_id),
    base_difficulty      float NOT NULL,
    created_by           uuid NOT NULL REFERENCES users(id),
    created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_questions_course_section_id ON questions(course_section_id);
CREATE INDEX idx_questions_bloom_level_id ON questions(bloom_level_id);
CREATE INDEX idx_questions_difficulty_level_id ON questions(difficulty_level_id);

CREATE TABLE question_options (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id  uuid NOT NULL REFERENCES questions(id),
    option_text  text NOT NULL,
    is_correct   boolean NOT NULL DEFAULT false,
    position     int NOT NULL
);
CREATE INDEX idx_question_options_question_id ON question_options(question_id);

CREATE TABLE question_topics (
    question_id uuid NOT NULL REFERENCES questions(id),
    topic_id    uuid NOT NULL REFERENCES topics(id),
    PRIMARY KEY (question_id, topic_id)
);
CREATE INDEX idx_question_topics_topic_id ON question_topics(topic_id);
