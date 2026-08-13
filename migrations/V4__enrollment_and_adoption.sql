-- V4__enrollment_and_adoption.sql

CREATE TABLE org_course_adoptions (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid NOT NULL REFERENCES organizations(id), -- the adopting org
    course_id        uuid NOT NULL REFERENCES courses(id),
    adopted_at       timestamptz NOT NULL DEFAULT now(),
    UNIQUE (organization_id, course_id)
);
CREATE INDEX idx_org_course_adoptions_course_id ON org_course_adoptions(course_id);

CREATE TABLE enrollments (
    id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id              uuid NOT NULL REFERENCES users(id),
    course_id            uuid NOT NULL REFERENCES courses(id),
    enrolled_at          timestamptz NOT NULL DEFAULT now(),
    enrollment_status_id smallint NOT NULL REFERENCES enrollment_statuses(enrollment_status_id)
);
CREATE INDEX idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX idx_enrollments_course_id ON enrollments(course_id);
