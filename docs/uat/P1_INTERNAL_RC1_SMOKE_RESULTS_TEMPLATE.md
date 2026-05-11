# P1 Internal RC1 Smoke Results Template

Use this template during local UAT setup and bounded internal RC smoke verification.

## Release Boundary Reminders

- This is a bounded internal RC, not a production release.
- Alerts live updates must remain disabled by default.
- Do not enable live updates unless you are explicitly verifying the deferred websocket boundary.
- Local-safe behavior is intentionally broader than active Keycloak behavior in some seams.
- AI alert feedback in active Keycloak mode requires `aiResponseId`.

## Local Startup Commands

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

### Direct Workspace Commands

```powershell
corepack pnpm --filter @aquapulse/api run dev
corepack pnpm --filter @aquapulse/web run dev
```

## Local-Safe Runtime Verification

Run these after startup when you need a quick bounded check of the local-safe stack:

```powershell
corepack pnpm auth:verify-runtime
corepack pnpm alerts:verify-runtime
corepack pnpm ponds:verify-runtime
corepack pnpm water-quality:verify-runtime
corepack pnpm feed:verify-runtime
corepack pnpm tasks:verify-runtime
```

Optional linked-surface verification:

```powershell
corepack pnpm ponds:verify-linked-smoke
```

## Live Updates Reminder

- Keep `AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES` unset or set to `false`.
- Keep `NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES` unset or set to `false`.
- Live updates are not assignment-scoped yet and are out of scope for normal RC smoke verification.

## Local Smoke DB Troubleshooting

If Windows Docker shows the smoke Postgres container as healthy but `localhost:54329` does not accept connections, use the Windows troubleshooting steps in [P1_INTERNAL_RC1_LOCAL_SMOKE_DB_TROUBLESHOOTING.md](/C:/Users/tanuj/code/AquaPulse/aquapulse/docs/uat/P1_INTERNAL_RC1_LOCAL_SMOKE_DB_TROUBLESHOOTING.md).

Important local-only note:

- the smoke DB prepare scripts do not read a raw `DATABASE_URL`
- they do support env overrides such as `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, and `DATABASE_PASSWORD`
- they also support smoke-specific overrides such as `AQUAPULSE_ALERTS_SMOKE_DB_HOST` and `AQUAPULSE_ALERTS_SMOKE_DB_PORT`
- if Docker port forwarding is broken, use those host/port env overrides for temporary recovery instead of changing any production config

## Smoke Result Log

| Surface | Environment | Mode | Result | Notes | Reviewer | Date |
| --- | --- | --- | --- | --- | --- | --- |
| API startup | local | local-safe | | | | |
| Web startup | local | local-safe | | | | |
| Auth runtime verifier | local | local-safe | | | | |
| Alerts runtime verifier | local | local-safe | | | | |
| Ponds runtime verifier | local | local-safe | | | | |
| Water-quality runtime verifier | local | local-safe | | | | |
| Feed runtime verifier | local | local-safe | | | | |
| Tasks runtime verifier | local | local-safe | | | | |
| Live updates default-off check | local | local-safe | | | | |
| Smoke DB port-forwarding check | local | local-safe | | | | |

