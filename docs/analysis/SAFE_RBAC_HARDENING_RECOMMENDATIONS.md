# Safe RBAC Hardening Recommendations

## Principles

Do not redesign auth yet.

Safe hardening should:

- stay route-metadata based
- avoid changing frontend behavior first
- avoid touching websocket architecture
- avoid changing contracts
- avoid introducing a new permission framework

## Best Next Seams

### 1. Harden AI Backend Routes

Recommended shape:

- require authentication for AI history routes
- require operator role for generation routes if that matches current operator intent

Why safe:

- AI already uses stable controller seams
- no contract change required
- frontend already explains advisory-only behavior

### 2. Harden Audit Backend Routes

Recommended shape:

- at minimum require authentication
- likely require operator role

Why safe:

- audit persistence is now real
- backend route surface is compact

### 3. Close Alerts Protection Gaps

Recommended shape:

- align `POST /api/alerts`
- align `PATCH /api/alerts/:id`
- align `POST /api/alerts/:id/attach-explanation`
- decide whether `GET /api/alerts/views` remains public by design

Why safe:

- same domain already uses bounded operator checks elsewhere

### 4. Harden Attachments And Batches

Recommended shape:

- require authentication first
- only add role checks if their operational use is already understood

Why safe:

- these modules are clearly under-protected today

## Changes To Avoid For Now

- repo-wide RBAC redesign
- introducing admin/supervisor taxonomy everywhere in one pass
- ownership rules without first mapping business expectations
- frontend-first protection changes without backend alignment
- websocket redesign

## Dangerous-To-Modify Areas

Avoid touching these without a dedicated seam:

- `apps/api/src/common/auth/*`
- `apps/api/src/modules/alerts/live-updates/*`
- `apps/web/src/features/auth-session.ts`
- `apps/web/src/features/auth-session-server.ts`
- shared auth/runtime diagnostics contracts and assumptions

## Safest Next Hardening Seam

Safest next bounded hardening session:

- `feature/p1-ai-and-audit-backend-route-hardening`

Scope:

- backend auth metadata only
- no contract change
- no frontend rewrite
- no websocket rewrite
