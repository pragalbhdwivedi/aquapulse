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

INSERT INTO alerts (
  id,
  title,
  severity,
  source,
  pond_id,
  status,
  assigned_to,
  review_state,
  review_label,
  latest_note,
  created_at,
  updated_at
) VALUES
  ('alert-1', 'Low dissolved oxygen warning', 'high', 'water-quality', 'pond-1', 'open', NULL, 'unreviewed', NULL, NULL, '2026-04-13T00:00:00.000Z', '2026-04-16T09:00:00.000Z'),
  ('alert-2', 'Feed anomaly follow-up', 'critical', 'feed', 'pond-1', 'acknowledged', 'operator-a', 'under_review', 'triage', 'Operator acknowledged and began review.', '2026-04-14T08:00:00.000Z', '2026-04-16T09:05:00.000Z'),
  ('alert-3', 'Resolved aeration drift', 'medium', 'water-quality', 'pond-2', 'resolved', 'operator-b', 'reviewed', 'closed', 'Resolved after equipment reset and confirmation reading.', '2026-04-12T06:30:00.000Z', '2026-04-15T07:45:00.000Z'),
  ('alert-4', 'Observation deferred for evening round', 'low', 'feed', 'pond-2', 'open', 'operator-a', 'deferred', 'night_shift', 'Deferred until the evening round because the pond is stable for now.', '2026-04-15T05:15:00.000Z', '2026-04-16T08:45:00.000Z');

INSERT INTO alert_action_history (
  id,
  alert_id,
  action,
  note,
  assigned_to,
  review_state,
  review_label,
  created_at
) VALUES
  ('history-alert-1-created', 'alert-1', 'created', 'Seeded open alert for verifier read paths.', NULL, 'unreviewed', NULL, '2026-04-13T00:00:00.000Z'),
  ('history-alert-2-created', 'alert-2', 'created', 'Seeded acknowledged alert.', NULL, 'unreviewed', NULL, '2026-04-14T08:00:00.000Z'),
  ('history-alert-2-assigned', 'alert-2', 'assigned', 'Assigned during initial triage.', 'operator-a', 'under_review', NULL, '2026-04-14T08:10:00.000Z'),
  ('history-alert-2-acknowledged', 'alert-2', 'acknowledged', 'Operator acknowledged and began review.', NULL, NULL, NULL, '2026-04-16T09:05:00.000Z'),
  ('history-alert-3-created', 'alert-3', 'created', 'Seeded resolved alert.', NULL, 'unreviewed', NULL, '2026-04-12T06:30:00.000Z'),
  ('history-alert-3-resolved', 'alert-3', 'resolved', 'Resolved after equipment reset and confirmation reading.', NULL, 'reviewed', 'closed', '2026-04-15T07:45:00.000Z'),
  ('history-alert-4-created', 'alert-4', 'created', 'Seeded deferred alert.', NULL, 'unreviewed', NULL, '2026-04-15T05:15:00.000Z'),
  ('history-alert-4-assigned', 'alert-4', 'assigned', 'Assigned to operator-a for later review.', 'operator-a', 'under_review', NULL, '2026-04-15T05:30:00.000Z'),
  ('history-alert-4-review-state', 'alert-4', 'review_state_changed', 'Deferred until the evening round because the pond is stable for now.', NULL, 'deferred', 'night_shift', '2026-04-16T08:45:00.000Z');

INSERT INTO saved_alert_views (
  id,
  name,
  preset_id,
  filter_query,
  created_at,
  updated_at
) VALUES
  (
    'alert-view-1',
    'Open queue',
    'all_open',
    '{"page":1,"pageSize":20,"status":"open","sortBy":"updatedAt_desc"}'::jsonb,
    '2026-04-16T09:00:00.000Z',
    '2026-04-16T09:00:00.000Z'
  );

COMMIT;
