BEGIN;

CREATE TABLE IF NOT EXISTS ai_requests (
  id text PRIMARY KEY,
  request_type text NOT NULL,
  requested_by text,
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ai_responses (
  id text PRIMARY KEY,
  request_id text NOT NULL REFERENCES ai_requests(id) ON DELETE CASCADE,
  status text NOT NULL,
  output_text text NOT NULL,
  model text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ai_requests_type_status_created_at
  ON ai_requests (request_type, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_requests_requested_by_created_at
  ON ai_requests (requested_by, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_responses_request_created_at
  ON ai_responses (request_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_responses_status_created_at
  ON ai_responses (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_responses_model_created_at
  ON ai_responses (model, created_at DESC);

COMMIT;
