# Authorization Boundary Map

## Global Rules

- Guards are attached per-controller, not globally.
- Real enforcement only happens when a route has:
  - `@RequireAuthentication()`
  - and/or `@RequireRoles(...)`
- In `disabled` and `local` auth modes, backend auth is intentionally bypassed.
- In `keycloak` mode, undecorated routes remain public even though guards are present.

## Route Groups

### Public Or Effectively Public

- `GET /api/health`
- `GET /api/auth/session`
- `POST /api/alerts`
- `PATCH /api/alerts/:id`
- `GET /api/alerts/views`
- `POST /api/alerts/:id/attach-explanation`
- all `ai` routes
- all `audit` routes
- all `attachments` routes
- all `batches` routes
- `GET /api/ponds`
- `GET /api/tasks`

### Authenticated But Not Role-Scoped

- `GET /api/diagnostics/runtime`

Notes:

- requires auth only in Keycloak mode
- no explicit operator/admin role check

### Authenticated Operator-Protected

- alerts:
  - `GET /api/alerts`
  - `GET /api/alerts/summary`
  - `POST /api/alerts/views`
  - `POST /api/alerts/views/:id/remove`
  - bulk lifecycle/triage/review routes
  - single alert lifecycle/triage/review routes
  - `GET /api/alerts/:id`
- ponds:
  - `POST /api/ponds`
  - `PATCH /api/ponds/:id`
  - `GET /api/ponds/:id`
- tasks:
  - `POST /api/tasks`
  - `PATCH /api/tasks/:id`
  - `GET /api/tasks/:id`
- feed:
  - `POST /api/feed`
  - `GET /api/feed`
  - `PATCH /api/feed/:id`
  - `GET /api/feed/:id`
- water-quality:
  - `POST /api/water-quality`
  - `GET /api/water-quality`
  - `PATCH /api/water-quality/:id`
  - `GET /api/water-quality/:id`

## Websocket Boundary

### Stronger Than Typical HTTP Coverage

Alerts live updates websocket subscription is one of the better enforced seams:

- Keycloak mode:
  - requires verified bearer token or valid ephemeral ticket
  - requires operator access
- local/disabled mode:
  - intentionally bypassed

### Remaining Limits

- no origin validation
- no long-lived connection revalidation
- ticket is not bound to client identity beyond short TTL

## Frontend Boundary Reality

Frontend “protected” surfaces are mostly:

- diagnostics and session-informed
- button-disabling
- read-surface gating
- explanatory messaging

They are not equivalent to a real frontend auth wall.
