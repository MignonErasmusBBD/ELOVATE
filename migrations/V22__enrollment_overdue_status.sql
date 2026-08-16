INSERT INTO enrollment_statuses (enrollment_status_id, status_code)
SELECT 4, 'overdue'
WHERE NOT EXISTS (
    SELECT 1 FROM enrollment_statuses WHERE status_code = 'overdue'
);

SELECT setval(
    pg_get_serial_sequence('enrollment_statuses', 'enrollment_status_id'),
    (SELECT MAX(enrollment_status_id) FROM enrollment_statuses)
);
