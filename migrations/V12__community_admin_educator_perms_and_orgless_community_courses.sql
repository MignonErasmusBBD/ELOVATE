-- Community courses can be authored without an organisation.
-- community_admin also receives every educator permission it does not already have.

ALTER TABLE courses
    ALTER COLUMN owning_organization_id DROP NOT NULL;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.role_id, p.permission_id
FROM roles r
JOIN permissions p ON p.permission_code IN (
    'user.read.org',
    'org.read.self',
    'course.community.read',
    'course.community.create',
    'course.community.update',
    'course.community.publish',
    'course.private.create',
    'course.private.read',
    'course.private.update',
    'course.private.delete',
    'course.section.write',
    'course.lesson.write',
    'enrollment.read.self',
    'question.create',
    'question.update',
    'question.delete',
    'question.metadata.tag',
    'quiz.attempt',
    'quiz.read.self',
    'quiz.read.org',
    'analytics.read.self',
    'analytics.read.org',
    'analytics.read.attempts',
    'analytics.read.mastery',
    'intervention.flag.read'
)
WHERE r.role_name = 'community_admin'
ON CONFLICT DO NOTHING;
