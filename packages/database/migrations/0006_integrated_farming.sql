BEGIN;

-- Additive manual-pilot aggregate. Existing pond tables and IDs are untouched.
CREATE TABLE IF NOT EXISTS farm_workspaces (
  organization_id text PRIMARY KEY,
  state jsonb NOT NULL,
  revision bigint NOT NULL DEFAULT 1 CHECK (revision > 0),
  created_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamptz NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (state->>'organizationId' = organization_id),
  CHECK (state->>'schemaVersion' = '1'),
  CHECK (jsonb_typeof(state->'memberships') = 'array'),
  CHECK (jsonb_typeof(state->'receipts') = 'array'),
  CHECK (octet_length(state::text) <= 33554432)
);

COMMIT;
