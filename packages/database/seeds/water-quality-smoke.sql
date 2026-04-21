BEGIN;

TRUNCATE TABLE water_quality, alert_action_history, saved_alert_views, alerts, ponds RESTART IDENTITY CASCADE;

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
  ('pond-1', 'North Pond 1', 'NP-01', 'farm-1', 'pond', 'active', '2026-04-13T00:00:00.000Z', '2026-04-13T00:00:00.000Z'),
  ('pond-2', 'South Pond 2', 'SP-02', 'farm-1', 'pond', 'active', '2026-04-13T00:00:00.000Z', '2026-04-13T00:00:00.000Z'),
  ('pond-3', 'West Pond 3', 'WP-03', 'farm-1', 'pond', 'maintenance', '2026-04-13T00:00:00.000Z', '2026-04-13T00:00:00.000Z');

INSERT INTO water_quality (
  id,
  pond_id,
  recorded_at,
  temperature_c,
  ph,
  created_at,
  updated_at
) VALUES
  (
    'wq-smoke-pond-1-latest',
    'pond-1',
    '2026-04-20T06:30:00.000Z',
    28.4,
    7.6,
    '2026-04-20T06:30:00.000Z',
    '2026-04-20T06:30:00.000Z'
  ),
  (
    'wq-smoke-pond-1-mid',
    'pond-1',
    '2026-04-19T18:15:00.000Z',
    29.1,
    7.4,
    '2026-04-19T18:15:00.000Z',
    '2026-04-19T18:15:00.000Z'
  ),
  (
    'wq-smoke-pond-1-old',
    'pond-1',
    '2026-04-18T05:45:00.000Z',
    27.8,
    7.7,
    '2026-04-18T05:45:00.000Z',
    '2026-04-18T05:45:00.000Z'
  ),
  (
    'wq-smoke-pond-2-breach',
    'pond-2',
    '2026-04-20T07:10:00.000Z',
    33.2,
    8.8,
    '2026-04-20T07:10:00.000Z',
    '2026-04-20T07:10:00.000Z'
  ),
  (
    'wq-smoke-pond-2-stable',
    'pond-2',
    '2026-04-17T09:00:00.000Z',
    28.0,
    7.3,
    '2026-04-17T09:00:00.000Z',
    '2026-04-17T09:00:00.000Z'
  ),
  (
    'wq-smoke-pond-3-missing-ph',
    'pond-3',
    '2026-04-16T10:20:00.000Z',
    26.9,
    NULL,
    '2026-04-16T10:20:00.000Z',
    '2026-04-16T10:20:00.000Z'
  );

COMMIT;
