BEGIN;

TRUNCATE TABLE alert_action_history, saved_alert_views, alerts, ponds RESTART IDENTITY CASCADE;

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
  ('pond-2', 'South Pond 2', 'SP-02', 'farm-1', 'pond', 'active', '2026-04-13T00:00:00.000Z', '2026-04-13T00:00:00.000Z');

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
