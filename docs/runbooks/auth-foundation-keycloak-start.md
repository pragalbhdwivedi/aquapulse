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
- If backend probes are enabled, compare frontend auth mode with backend auth mode and validation strategy.
- The protected layout sidebar also shows the current effective frontend auth label.

## Intentionally deferred in this branch

- Full production-grade token verification and JWKS validation
- Full repo-wide guard enforcement
- Login/logout UI
- Production SSO hardening
