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
- If backend probes are enabled, compare frontend auth mode with backend auth mode and validation strategy.
- The protected layout sidebar also shows the current effective frontend auth label.
- The first bounded protected slice is `GET /diagnostics/runtime`.
- The first protected operator action slice is `alerts lifecycle actions`:
  `POST /alerts/:id/acknowledge` and `POST /alerts/:id/resolve`.
- The alerts workbench now reflects bounded operator guarding in the UI:
  lifecycle actions are disabled when Keycloak mode is active but no forwarded auth session is available, and adjacent triage controls follow the same bounded UI guard for clarity.
- In Keycloak mode, `/api/health` can still be reachable while `/api/diagnostics/runtime` returns an auth-required partial probe state until a verified bearer token is supplied.

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
```

If Keycloak mode is active but no forwardable token is available, the runtime diagnostics surface will show auth forwarding as unavailable and the protected operator slice will reject backend requests in Keycloak mode.
The frontend session/bootstrap seam will also report the session as `unavailable`, and guarded operator controls on the alerts page will stay disabled with a readable warning instead of failing silently.

## Intentionally deferred in this branch

- Full repo-wide guard enforcement
- Login/logout UI
- Production SSO hardening
