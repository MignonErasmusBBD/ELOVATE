-- V15__course_quiz_question_count.sql
-- Allows educators to configure how many questions are drawn per practice quiz attempt.
-- Hard maximum of 20 questions enforced by the constraint; default is 10.

ALTER TABLE courses
    ADD COLUMN quiz_question_count smallint NOT NULL DEFAULT 10
        CONSTRAINT chk_quiz_question_count CHECK (quiz_question_count BETWEEN 1 AND 20);
