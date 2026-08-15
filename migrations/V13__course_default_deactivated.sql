-- New courses start deactivated until an educator activates them.
ALTER TABLE courses
    ALTER COLUMN course_status_id SET DEFAULT 2;
