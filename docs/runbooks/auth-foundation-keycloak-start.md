# Auth Foundation And Keycloak Cutover Start

Default behavior stays safe for local development.

- API auth mode defaults to `disabled`.
- Web auth diagnostics default to `disabled`.
- Existing mock/in-memory and local runtime flows continue to work without Keycloak.

## Modes

- `disabled`: no auth enforcement, useful for current local development.
- `local`: backend hydrates a deterministic local operator from env defaults or bounded dev headers.
- `keycloak`: bounded cutover mode that expects Keycloak-shaped config and bearer claims.

## Required env when enabling Keycloak mode

Backend:

```bash
AQUAPULSE_AUTH_MODE=keycloak
AQUAPULSE_KEYCLOAK_ISSUER_URL=http://localhost:8080/realms/aquapulse
AQUAPULSE_KEYCLOAK_JWKS_URL=http://localhost:8080/realms/aquapulse/protocol/openid-connect/certs
AQUAPULSE_KEYCLOAK_REALM=aquapulse
AQUAPULSE_KEYCLOAK_CLIENT_ID=aquapulse-web
```

Frontend diagnostics visibility:

```bash
NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE=keycloak
NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_ISSUER_URL=http://localhost:8080/realms/aquapulse
NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_REALM=aquapulse
NEXT_PUBLIC_AQUAPULSE_WEB_KEYCLOAK_CLIENT_ID=aquapulse-web
```

## Local operator mode

For bounded local testing without a live IdP:

```bash
AQUAPULSE_AUTH_MODE=local
AQUAPULSE_AUTH_LOCAL_USER_ID=local-operator
AQUAPULSE_AUTH_LOCAL_USERNAME=local.operator
AQUAPULSE_AUTH_LOCAL_DISPLAY_NAME=Local Operator
AQUAPULSE_AUTH_LOCAL_ROLES=operator
```

Optional per-request dev headers:

```text
x-aquapulse-dev-user
x-aquapulse-dev-username
x-aquapulse-dev-display-name
x-aquapulse-dev-roles
x-aquapulse-dev-permissions
```

## How to verify auth mode

- Open the runtime diagnostics page.
- Check `Auth runtime` on the web diagnostics card.
- Check `Session bootstrap` on the runtime diagnostics card or protected layout shell.
- If backend current-session resolution is enabled, also check `Session source` and `Current-session endpoint`.
- If backend probes are enabled, compare frontend auth mode with backend auth mode and validation strategy.
- The protected layout sidebar also shows the current effective frontend auth label.
- The first bounded protected slice is `GET /diagnostics/runtime`.
- The bounded protected read slice is `GET /alerts` for alerts list reads.
- The second bounded protected read slice is `GET /alerts/:id` for alerts detail reads.
- The third bounded protected read slice is `GET /alerts/summary` for alerts summary reads.
- The first protected operator action slice is `alerts lifecycle actions`:
  `POST /alerts/:id/acknowledge` and `POST /alerts/:id/resolve`.
- The second protected operator slice is `alerts triage actions`:
  `POST /alerts/:id/assign`, `POST /alerts/:id/unassign`, and `POST /alerts/:id/review-state`.
- The third protected operator slice is `alerts bulk actions`:
  `POST /alerts/bulk/acknowledge`, `POST /alerts/bulk/resolve`, `POST /alerts/bulk/assign`, and `POST /alerts/bulk/review-state`.
- The fourth protected operator slice is `alerts saved-view mutation actions`:
  `POST /alerts/views` and `POST /alerts/views/:id/remove`.
- The first bounded non-alert protected operator slice is `tasks update`:
  `PATCH /tasks/:id`.
- The alerts workbench now reflects bounded operator guarding in the UI:
  lifecycle, triage, bulk, and saved-view mutation actions are disabled when Keycloak mode is active but no forwarded auth session is available, while disabled/local modes continue to use the safe bounded bypass path.
- The tasks page now reflects the same bounded protection model for the first task update form:
  in Keycloak mode the update action is disabled until forwarded auth/current-session is available, while disabled/local modes continue to use the safe bounded bypass path.
- In Keycloak mode, `/api/health` can still be reachable while `/api/diagnostics/runtime` returns an auth-required partial probe state until a verified bearer token is supplied.
- For a bounded local verification pass that also checks current-session and the protected alerts slices together, use `docs/runbooks/auth-local-keycloak-verifier.md` and run `corepack pnpm auth:verify-runtime`.

## Web-to-API token forwarding

The local web bridge can forward auth to the API in a bounded way for the protected slices above.

Forwarding source order:

1. Incoming `Authorization` header passthrough
2. Cookie named by `AQUAPULSE_WEB_AUTH_TOKEN_COOKIE_NAME`
3. Server-side fallback token from `AQUAPULSE_WEB_AUTH_BEARER_TOKEN`

Useful local env:

```bash
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
AQUAPULSE_WEB_AUTH_BEARER_TOKEN=
AQUAPULSE_WEB_AUTH_TOKEN_COOKIE_NAME=aquapulse_auth_token
AQUAPULSE_WEB_ENABLE_BACKEND_CURRENT_SESSION=false
AQUAPULSE_WEB_CURRENT_SESSION_TIMEOUT_MS=1200
```

If Keycloak mode is active but no forwardable token is available, the runtime diagnostics surface will show auth forwarding as unavailable and the protected operator slice will reject backend requests in Keycloak mode.
The frontend session/bootstrap seam will also report the session as `unavailable`, and guarded operator controls on the alerts page will stay disabled with a readable warning instead of failing silently.

## Current-session surface

The backend now exposes a bounded current-session endpoint at:

```text
/api/auth/session
```

Safe payload scope:

- requested/effective auth mode
- session availability state
- auth source summary
- current user id/display name/username/email when available
- active roles and permissions
- protected operator slice label/enforcement
- protected read slice label/enforcement
- secondary protected read slice label/enforcement
- secondary protected operator slice label/enforcement
- tertiary protected operator slice label/enforcement
- quaternary protected operator slice label/enforcement
- bounded non-alert protected operator slice label/enforcement
- safe warnings

What is intentionally not exposed:

- raw bearer tokens
- cookies
- full profile management
- login/logout flows

When `AQUAPULSE_WEB_ENABLE_BACKEND_CURRENT_SESSION=true`, the web app will try to use the backend current-session endpoint as a more grounded source of truth. If it is unavailable, the frontend falls back to runtime-derived auth state and reports that fallback in diagnostics.
Protected layout, runtime diagnostics, and the alerts workbench will all show whether they are currently using backend-derived session state or runtime-derived fallback state, along with the resolved current user/provider/role summary and alerts access level when available. The alerts workbench also uses that current-session surface to explain whether list/detail/summary reads and saved-view create/remove controls are active, bypassed, or blocked due to missing forwarded auth.
The tasks page now reuses the same current-session/runtime model to explain whether the bounded `tasks_update` slice is active, bypassed, or blocked because forwarded auth/session state is missing.
The feed page now reuses that same bounded non-alert operator model to explain whether `feed_update` is active, bypassed, or blocked because forwarded auth/current-session state is missing, while still keeping the update form readable in disabled and local modes.
The pond detail page now applies the same bounded operator model to `ponds_update`, showing when the action is available, protected and waiting on forwarded auth/current-session, or safely bypassed in disabled/local modes.
The pond detail page now uses that same bounded operator model for `water_quality_create`, so the create action stays readable but only becomes runnable in Keycloak mode when forwarded auth/current-session are both sufficient.
The pond detail page now uses that same bounded operator model for `water_quality_update`, so the latest reading edit stays visible but only becomes runnable in Keycloak mode when forwarded auth/current-session are both sufficient.
The feed page now applies that same bounded operator model to `feed_create`, so the create form stays visible but only becomes runnable in Keycloak mode when forwarded auth/current-session are both sufficient.
The tasks page now applies that same bounded operator model to `tasks_create`, so the create form stays visible but only becomes runnable in Keycloak mode when forwarded auth/current-session are both sufficient.
The ponds page now applies that same bounded operator model to `ponds_create`, so the create form stays visible but only becomes runnable in Keycloak mode when forwarded auth/current-session are both sufficient.
The runtime page and alerts workbench now also distinguish surface exposure explicitly:

- `alerts_list_read`: `backend_protected`
- `alerts_detail_read`: `backend_protected`
- `alerts_summary_read`: `backend_protected`
- alerts mutation controls: bounded `ui_guarded` surfaces whose buttons stay readable even when
  forwarding/session state is insufficient
- `non_alert_operator_update_access`: shared bounded non-alert operator access summary used by
  `tasks_update`, `feed_update`, `ponds_update`, `water_quality_create`, `water_quality_update`, `feed_create`, `tasks_create`, and `ponds_create`
- `tasks_update`: first bounded non-alert `ui_guarded` + backend-enforced operator slice
- `feed_update`: second bounded non-alert `ui_guarded` + backend-enforced operator slice
- `ponds_update`: third bounded non-alert `ui_guarded` + backend-enforced operator slice
- `water_quality_create`: fourth bounded non-alert `ui_guarded` + backend-enforced operator slice
- `water_quality_update`: fifth bounded non-alert `ui_guarded` + backend-enforced operator slice
- `feed_create`: sixth bounded non-alert `ui_guarded` + backend-enforced operator slice
- `tasks_create`: seventh bounded non-alert `ui_guarded` + backend-enforced operator slice
- `ponds_create`: eighth bounded non-alert `ui_guarded` + backend-enforced operator slice

In Keycloak mode, those eight bounded non-alert operator actions require forwarded auth and a current-session that resolves to an authenticated user before the UI will enable the action. In disabled and local modes, the same shared summary reports a bounded bypass path so mock/in-memory development stays usable.

You can see the shared summary and the eight bounded non-alert slices in:
- `/api/auth/session`
- `/runtime` frontend diagnostics
- backend runtime diagnostics when runtime probing is enabled

If `ponds_update`, `water_quality_create`, `water_quality_update`, `feed_create`, `tasks_create`, or `ponds_create` is blocked in Keycloak mode, check:
- `Forwarded auth`
- `Current-session endpoint`
- `Session availability`
- `Non-alert operator shared state`

This branch still intentionally does not roll full RBAC or full-domain auth onto the rest of ponds, feed, tasks, water-quality, or websocket surfaces beyond the already bounded slices.

## Intentionally deferred in this branch

- Full repo-wide guard enforcement
- Login/logout UI
- Production SSO hardening
