-- V7__cohorts_and_intervention.sql

CREATE TABLE cohorts (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id  uuid NOT NULL REFERENCES organizations(id),
    name             varchar(255) NOT NULL,
    created_at       timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_cohorts_organization_id ON cohorts(organization_id);

CREATE TABLE cohort_members (
    cohort_id  uuid NOT NULL REFERENCES cohorts(id),
    user_id    uuid NOT NULL REFERENCES users(id),
    PRIMARY KEY (cohort_id, user_id)
);
CREATE INDEX idx_cohort_members_user_id ON cohort_members(user_id);

CREATE TABLE intervention_rules (
    id                           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id              uuid REFERENCES organizations(id), -- NULL = platform-default rule
    rule_name                    varchar(255) NOT NULL,
    intervention_trigger_type_id smallint NOT NULL REFERENCES intervention_trigger_types(intervention_trigger_type_id),
    threshold_value              float NOT NULL,
    window_size                  int NOT NULL,
    created_at                   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_intervention_rules_organization_id ON intervention_rules(organization_id);

CREATE TABLE intervention_flags (
    id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                     uuid NOT NULL REFERENCES users(id),
    course_id                   uuid NOT NULL REFERENCES courses(id),
    rule_id                     uuid NOT NULL REFERENCES intervention_rules(id),
    triggered_at                timestamptz NOT NULL DEFAULT now(),
    intervention_flag_status_id smallint NOT NULL REFERENCES intervention_flag_statuses(intervention_flag_status_id),
    resolved_by                 uuid REFERENCES users(id),
    resolved_at                 timestamptz
);
CREATE INDEX idx_intervention_flags_user_id ON intervention_flags(user_id);
CREATE INDEX idx_intervention_flags_course_id ON intervention_flags(course_id);

-- Partial index for the hot "open flags" query — intervention_flag_status_id = 1 is
-- 'open', per the fixed seed id assigned in V1.
CREATE INDEX idx_intervention_flags_open
    ON intervention_flags(intervention_flag_status_id)
    WHERE intervention_flag_status_id = 1;
