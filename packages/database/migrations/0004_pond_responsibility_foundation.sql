BEGIN;

CREATE TABLE IF NOT EXISTS pond_responsibilities (
  id text PRIMARY KEY,
  user_id text NOT NULL,
  pond_id text NOT NULL REFERENCES ponds(id) ON DELETE CASCADE,
  responsibility_type text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pond_responsibilities_user_active_pond
  ON pond_responsibilities (user_id, active, pond_id);

CREATE INDEX IF NOT EXISTS idx_pond_responsibilities_pond_active_user
  ON pond_responsibilities (pond_id, active, user_id);

COMMIT;
