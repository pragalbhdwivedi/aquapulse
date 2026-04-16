BEGIN;

CREATE TABLE IF NOT EXISTS ponds (
  id text PRIMARY KEY,
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  farm_id text NOT NULL,
  kind text NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_quality (
  id text PRIMARY KEY,
  pond_id text NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  recorded_at timestamptz NOT NULL,
  temperature_c numeric,
  ph numeric,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS feed_entries (
  id text PRIMARY KEY,
  pond_id text NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  batch_id text,
  feed_type text NOT NULL,
  quantity_kg numeric NOT NULL,
  fed_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tasks (
  id text PRIMARY KEY,
  title text NOT NULL,
  status text NOT NULL,
  assignee_id text,
  pond_id text REFERENCES ponds(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alerts (
  id text PRIMARY KEY,
  title text NOT NULL,
  severity text NOT NULL,
  source text NOT NULL,
  pond_id text REFERENCES ponds(id) ON DELETE SET NULL,
  status text NOT NULL,
  assigned_to text,
  review_state text,
  review_label text,
  latest_note text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_action_history (
  id text PRIMARY KEY,
  alert_id text NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  action text NOT NULL,
  note text,
  assigned_to text,
  review_state text,
  review_label text,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_alert_views (
  id text PRIMARY KEY,
  name text NOT NULL,
  preset_id text,
  filter_query jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_water_quality_pond_recorded_at
  ON water_quality (pond_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_feed_entries_pond_fed_at
  ON feed_entries (pond_id, fed_at DESC);

CREATE INDEX IF NOT EXISTS idx_tasks_status_assignee
  ON tasks (status, assignee_id);

CREATE INDEX IF NOT EXISTS idx_alerts_status_assigned_review
  ON alerts (status, assigned_to, review_state, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_alerts_pond_created_at
  ON alerts (pond_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_action_history_alert_created_at
  ON alert_action_history (alert_id, created_at DESC);

COMMIT;
