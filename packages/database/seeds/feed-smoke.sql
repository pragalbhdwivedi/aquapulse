BEGIN;

TRUNCATE TABLE feed_entries, alerts, water_quality, alert_action_history, saved_alert_views, tasks, ponds RESTART IDENTITY CASCADE;

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

INSERT INTO feed_entries (
  id,
  pond_id,
  batch_id,
  feed_type,
  quantity_kg,
  fed_at,
  created_at,
  updated_at
) VALUES
  (
    'feed-1',
    'pond-1',
    'batch-pond-1-a',
    'Grower Feed',
    92,
    '2026-04-20T07:30:00.000Z',
    '2026-04-20T07:30:00.000Z',
    '2026-04-20T07:30:00.000Z'
  ),
  (
    'feed-2',
    'pond-1',
    'batch-pond-1-a',
    'Starter Feed',
    38,
    '2026-04-19T18:00:00.000Z',
    '2026-04-19T18:00:00.000Z',
    '2026-04-19T18:00:00.000Z'
  ),
  (
    'feed-3',
    'pond-1',
    'batch-pond-1-b',
    'Finisher Feed',
    44,
    '2026-04-18T06:15:00.000Z',
    '2026-04-18T06:15:00.000Z',
    '2026-04-18T06:15:00.000Z'
  ),
  (
    'feed-4',
    'pond-2',
    'batch-pond-2-a',
    'Starter Feed',
    26,
    '2026-04-20T05:45:00.000Z',
    '2026-04-20T05:45:00.000Z',
    '2026-04-20T05:45:00.000Z'
  ),
  (
    'feed-5',
    'pond-2',
    'batch-pond-2-b',
    'Grower Feed',
    31,
    '2026-04-17T16:20:00.000Z',
    '2026-04-17T16:20:00.000Z',
    '2026-04-17T16:20:00.000Z'
  );

COMMIT;
