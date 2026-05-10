BEGIN;

CREATE TABLE IF NOT EXISTS ai_feedback (
  id text PRIMARY KEY,
  alert_id text NOT NULL REFERENCES alerts(id) ON DELETE CASCADE,
  ai_response_id text REFERENCES ai_responses(id) ON DELETE SET NULL,
  ai_request_id text REFERENCES ai_requests(id) ON DELETE SET NULL,
  submitted_by text,
  value text NOT NULL,
  note text,
  explanation_payload jsonb,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_alert_created_at
  ON ai_feedback (alert_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_response_created_at
  ON ai_feedback (ai_response_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_request_created_at
  ON ai_feedback (ai_request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_submitted_by_created_at
  ON ai_feedback (submitted_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_created_at
  ON ai_feedback (created_at DESC);

COMMIT;
