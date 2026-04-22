BEGIN;

TRUNCATE TABLE tasks, feed_entries, water_quality, alert_action_history, saved_alert_views, alerts, ponds RESTART IDENTITY CASCADE;

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
  (
    'pond-1',
    'North Nursery',
    'NN-01',
    'farm-1',
    'pond',
    'active',
    '2026-04-13T00:00:00.000Z',
    '2026-04-20T07:15:00.000Z'
  ),
  (
    'pond-2',
    'South Growout',
    'SG-02',
    'farm-1',
    'tank',
    'maintenance',
    '2026-04-13T00:00:00.000Z',
    '2026-04-19T05:30:00.000Z'
  ),
  (
    'pond-3',
    'East Reserve',
    'ER-03',
    'farm-2',
    'cage',
    'inactive',
    '2026-04-13T00:00:00.000Z',
    '2026-04-18T09:45:00.000Z'
  ),
  (
    'pond-4',
    'West Nursery',
    'WN-04',
    'farm-2',
    'pond',
    'active',
    '2026-04-13T00:00:00.000Z',
    '2026-04-17T06:10:00.000Z'
  );

COMMIT;
