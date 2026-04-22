BEGIN;

TRUNCATE TABLE tasks, alerts, feed_entries, water_quality, alert_action_history, saved_alert_views, ponds RESTART IDENTITY CASCADE;

INSERT INTO ponds (
  id,
  name,
  code,
  farm_id,
  kind,
  status,
  created_at,
  updated_at
) VALUES
  ('pond-1', 'North Nursery', 'NN-01', 'farm-1', 'pond', 'active', '2026-04-13T00:00:00.000Z', '2026-04-20T07:15:00.000Z'),
  ('pond-2', 'South Growout', 'SG-02', 'farm-1', 'tank', 'maintenance', '2026-04-13T00:00:00.000Z', '2026-04-19T05:30:00.000Z');

INSERT INTO tasks (
  id,
  title,
  status,
  assignee_id,
  pond_id,
  created_at,
  updated_at
) VALUES
  (
    'task-1',
    'Inspect inlet valve',
    'todo',
    'user-1',
    'pond-1',
    '2026-04-20T07:00:00.000Z',
    '2026-04-20T07:00:00.000Z'
  ),
  (
    'task-2',
    'Review aerator logs',
    'in_progress',
    'user-2',
    'pond-1',
    '2026-04-19T18:10:00.000Z',
    '2026-04-20T06:45:00.000Z'
  ),
  (
    'task-3',
    'Confirm night feed schedule',
    'done',
    'user-3',
    'pond-1',
    '2026-04-18T05:40:00.000Z',
    '2026-04-19T05:55:00.000Z'
  ),
  (
    'task-4',
    'Clean south pond intake screen',
    'cancelled',
    NULL,
    'pond-2',
    '2026-04-17T14:20:00.000Z',
    '2026-04-18T09:15:00.000Z'
  ),
  (
    'task-5',
    'Stage spare pump housing',
    'todo',
    'user-2',
    NULL,
    '2026-04-16T11:30:00.000Z',
    '2026-04-16T11:30:00.000Z'
  );

COMMIT;
