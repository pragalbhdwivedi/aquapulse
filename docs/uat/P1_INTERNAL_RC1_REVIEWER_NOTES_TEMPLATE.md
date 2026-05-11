# P1 Internal RC1 Reviewer Notes Template

Use this page for free-form reviewer notes after smoke/UAT runs.

## Reviewer Context

- Reviewer:
- Date:
- Environment:
- Mode:
  - `local-safe`
  - `active Keycloak`

## Local Setup Used

### Start Both Apps

```powershell
corepack pnpm dev
```

### Start API Only

```powershell
corepack pnpm dev:api
```

### Start Web Only

```powershell
corepack pnpm dev:web
```

### Runtime Verifiers Used

```powershell
corepack pnpm auth:verify-runtime
corepack pnpm alerts:verify-runtime
corepack pnpm ponds:verify-runtime
corepack pnpm water-quality:verify-runtime
corepack pnpm feed:verify-runtime
corepack pnpm tasks:verify-runtime
```

## Windows Smoke DB Port-Forwarding Note

If the local smoke Postgres container is healthy but Windows cannot connect to `localhost:54329`, use [P1_INTERNAL_RC1_LOCAL_SMOKE_DB_TROUBLESHOOTING.md](/C:/Users/tanuj/code/AquaPulse/aquapulse/docs/uat/P1_INTERNAL_RC1_LOCAL_SMOKE_DB_TROUBLESHOOTING.md).

Boundaries for reviewers:

- this is a local Windows Docker forwarding issue, not an API auth or schema issue
- smoke prep commands support `DATABASE_HOST` and `DATABASE_PORT` style overrides
- smoke prep commands do not currently consume a raw `DATABASE_URL`
- do not change production config or runtime authorization behavior while working around local smoke DB access

## Release Boundary Reminders

- This RC is for bounded internal review only.
- Alerts live updates must stay default-off.
- Saved-view ownership is still deferred.
- Attachment file-content and download routes are not implemented.
- Reviewer/admin override models are still deferred.
- AI alert feedback requires `aiResponseId` in active Keycloak mode.
- Local-safe behavior may be intentionally broader than active Keycloak behavior.

## Notes

### Startup Experience

- Commands used:
- Any blocker:
- Any env confusion:
- Any Windows Docker port-forwarding issue on `localhost:54329`:
- If a workaround was used, which env overrides were applied:

### Authorization Behavior

- Active Keycloak observations:
- Local-safe observations:
- Any mismatch between expected and actual scope:

### UI / DX Observations

- Web runtime notes:
- Diagnostics notes:
- Docs clarity notes:
- Smoke DB troubleshooting notes:

### Deferred Boundary Confusion

- Any reviewer confusion around live updates:
- Any reviewer confusion around saved views:
- Any reviewer confusion around file access:

### Suggested Follow-Ups

- Highest-priority next action:
- Suggested owner:
- Suggested branch:
