BEGIN;

CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  summary text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_event_metadata (
  id text PRIMARY KEY,
  audit_event_id text NOT NULL UNIQUE REFERENCES audit_events(id) ON DELETE CASCADE,
  request_id text,
  correlation_id text,
  actor_id text,
  http_method text,
  request_path text,
  status_code integer,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_events_resource_created_at
  ON audit_events (resource_type, resource_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_events_action_created_at
  ON audit_events (action, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_event_metadata_actor_created_at
  ON audit_event_metadata (actor_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_event_metadata_request_id
  ON audit_event_metadata (request_id);

COMMIT;
