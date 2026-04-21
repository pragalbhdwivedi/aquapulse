# Local Keycloak/Auth Verifier Runbook

This runbook gives you a bounded local verification path for AquaPulse auth without changing the default repo posture.

Default behavior still stays safe:

- mock/in-memory runtime remains the default
- auth defaults to `disabled`
- no live Keycloak instance is required for normal repo verification

## What This Verifier Checks

`corepack pnpm auth:verify-runtime` can check, in a bounded way:

- backend auth mode via `/api/health`
- web-to-API current-session resolution via `/api/auth/session`
- local proxy forwarding headers
- protected alerts detail read behavior
- protected alerts lifecycle action behavior
- protected alerts triage action behavior
- protected alerts bulk action behavior
- protected alerts saved-view mutation behavior

The verifier is designed to treat both of these as valid outcomes:

- success when auth is disabled/local, or when Keycloak mode has an authenticated forwarded session
- clear auth failure when Keycloak mode is active but forwarding/session is missing

## Useful Env Vars

```env
AQUAPULSE_AUTH_VERIFY_WEB_BASE_URL=http://localhost:3000
AQUAPULSE_AUTH_VERIFY_API_BASE_URL=http://localhost:4000
AQUAPULSE_AUTH_VERIFY_EXPECT_AUTH_MODE=auto
AQUAPULSE_AUTH_VERIFY_BEARER_TOKEN=
AQUAPULSE_AUTH_VERIFY_ALERT_ID=alert-1
AQUAPULSE_AUTH_VERIFY_OWNER=operator-verification
AQUAPULSE_AUTH_VERIFY_ENABLE_MUTATIONS=false
```

Related web bridge env:

```env
AQUAPULSE_WEB_LOCAL_API_BACKEND_URL=http://localhost:4000
AQUAPULSE_WEB_AUTH_BEARER_TOKEN=
AQUAPULSE_WEB_AUTH_TOKEN_COOKIE_NAME=aquapulse_auth_token
AQUAPULSE_WEB_ENABLE_BACKEND_CURRENT_SESSION=true
```

Related backend auth env:

```env
AQUAPULSE_AUTH_MODE=disabled
# or
AQUAPULSE_AUTH_MODE=local
# or
AQUAPULSE_AUTH_MODE=keycloak

AQUAPULSE_KEYCLOAK_ISSUER_URL=http://localhost:8080/realms/aquapulse
AQUAPULSE_KEYCLOAK_JWKS_URL=http://localhost:8080/realms/aquapulse/protocol/openid-connect/certs
AQUAPULSE_KEYCLOAK_REALM=aquapulse
AQUAPULSE_KEYCLOAK_CLIENT_ID=aquapulse-web
```

## Recommended Local Scenarios

### 1. Safe default check

Use default disabled auth and verify the safe local posture:

```powershell
corepack pnpm auth:verify-runtime
```

Expected shape:

- backend auth mode: `disabled`
- current-session availability: `disabled`
- protected alerts expectation: `success`
- alerts detail read slice: `succeeded`
- protected mutation checks: skipped unless you explicitly enable them

### 2. Local dev-user auth check

Use bounded local mode:

```env
AQUAPULSE_AUTH_MODE=local
AQUAPULSE_AUTH_LOCAL_ROLES=operator
AQUAPULSE_WEB_ENABLE_BACKEND_CURRENT_SESSION=true
```

Then run:

```powershell
corepack pnpm auth:verify-runtime
```

Expected shape:

- backend auth mode: `local`
- current-session availability: `local_user`
- protected alerts expectation: `success`
- alerts detail read slice: `succeeded`

### 3. Keycloak mode with no forwarded auth

Use Keycloak-shaped backend/frontend config but no token:

```env
AQUAPULSE_AUTH_MODE=keycloak
NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE=keycloak
AQUAPULSE_WEB_ENABLE_BACKEND_CURRENT_SESSION=true
```

Then run:

```powershell
corepack pnpm auth:verify-runtime
```

Expected shape:

- backend auth mode: `keycloak`
- current-session availability: `unauthenticated`
- protected alerts expectation: `unauthorized`
- alerts detail read slice: rejected with `401` or `403`

This is a valid bounded failure path and confirms the protected alerts slices reject missing forwarded auth clearly.

### 4. Keycloak mode with a bounded forwarded token

If you have a usable bearer token, provide it either:

- directly to the verifier with `AQUAPULSE_AUTH_VERIFY_BEARER_TOKEN`
- or to the web bridge with `AQUAPULSE_WEB_AUTH_BEARER_TOKEN`

Example:

```powershell
$env:AQUAPULSE_AUTH_MODE='keycloak'
$env:NEXT_PUBLIC_AQUAPULSE_WEB_AUTH_MODE='keycloak'
$env:AQUAPULSE_WEB_ENABLE_BACKEND_CURRENT_SESSION='true'
$env:AQUAPULSE_AUTH_VERIFY_BEARER_TOKEN='eyJ...'
corepack pnpm auth:verify-runtime
```

Expected shape:

- current-session availability: `authenticated_user`
- proxy forwarding header: `present`
- protected alerts expectation: `success`
- alerts detail read slice: `succeeded`

If you also want to exercise the mutation success path:

```powershell
$env:AQUAPULSE_AUTH_VERIFY_ENABLE_MUTATIONS='true'
corepack pnpm auth:verify-runtime
```

That runs:

- lifecycle acknowledge
- alerts detail read
- triage assign
- bulk review-state update
- saved-view create/remove

## How To Read The Output

Key lines to watch:

- `Backend auth mode`
- `Backend auth verification`
- `Current-session availability`
- `Current-session auth source`
- `Web proxy forwarded auth`
- `Protected alerts expectation`
- `Alerts detail read slice`

If `Protected alerts expectation` is:

- `success`: the verifier expects protected alerts mutations to work
- `unauthorized`: the verifier expects protected alerts mutations to fail clearly with `401` or `403`

## Runtime Diagnostics Cross-Check

Use `/runtime` to confirm:

- requested vs effective auth mode
- forwarding mode and whether forwarded auth is present
- whether current-session is backend-derived
- whether the alerts detail read slice is backend-enforced and currently available
- which alerts slices are backend-enforced

If the verifier says `unauthorized` and the runtime page shows Keycloak active with forwarding unavailable, that is the expected bounded local outcome.

## Intentionally Deferred

- full login/logout UI
- repo-wide auth enforcement
- production SSO hardening
- live Keycloak orchestration inside this repo
