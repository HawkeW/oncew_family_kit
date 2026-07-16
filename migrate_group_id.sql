UPDATE wedding_finances SET group_id = 1 WHERE group_id IS NULL;
UPDATE wedding_tasks SET group_id = 1 WHERE group_id IS NULL;
UPDATE wedding_rsvps SET group_id = 1 WHERE group_id IS NULL;
UPDATE wedding_timelines SET group_id = 1 WHERE group_id IS NULL;
