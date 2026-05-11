# P1 Internal RC1 Local Smoke DB Troubleshooting

Use this page when the local smoke Postgres container is healthy in Docker but Windows cannot reach the forwarded host port on `localhost:54329`.

This is a local UAT and DX troubleshooting path only. Do not change runtime authorization behavior, API contracts, database schema, frontend behavior, live-update defaults, or production config while following these steps.

## Symptom Pattern

Typical failure pattern on Windows:

- `docker port aquapulse-alerts-smoke-postgres` reports `5432/tcp -> 0.0.0.0:54329`
- `netstat -ano | findstr :54329` shows nothing listening
- `Test-NetConnection 127.0.0.1 -Port 54329` fails
- `docker exec aquapulse-alerts-smoke-postgres pg_isready -U aquapulse -d aquapulse` succeeds
- `docker exec aquapulse-alerts-smoke-postgres psql -U aquapulse -d aquapulse -c "select 1"` succeeds

That usually means Postgres is healthy inside the container, but Docker Desktop port forwarding on Windows is stale or not attached.

## First Checks

Start or confirm the local smoke container:

```powershell
corepack pnpm alerts:smoke:db:up
docker ps --filter "name=aquapulse-alerts-smoke-postgres"
docker port aquapulse-alerts-smoke-postgres
```

Verify whether Windows is actually listening on the forwarded port:

```powershell
netstat -ano | findstr :54329
Test-NetConnection 127.0.0.1 -Port 54329
```

Verify whether Postgres is healthy inside the container:

```powershell
docker exec aquapulse-alerts-smoke-postgres pg_isready -U aquapulse -d aquapulse
docker exec aquapulse-alerts-smoke-postgres psql -U aquapulse -d aquapulse -c "select 1"
```

## Recommended Windows Recovery

If the container is healthy internally but Windows still cannot reach `localhost:54329`:

1. Restart Docker Desktop completely.
2. Re-run:

```powershell
netstat -ano | findstr :54329
Test-NetConnection 127.0.0.1 -Port 54329
```

3. If the port is still missing, shut down WSL:

```powershell
wsl --shutdown
```

4. Start Docker Desktop again and re-run:

```powershell
corepack pnpm alerts:smoke:db:up
netstat -ano | findstr :54329
Test-NetConnection 127.0.0.1 -Port 54329
```

Once `Test-NetConnection` succeeds, continue with the normal smoke prepare command.

## Smoke Prepare Command Override Support

The smoke prepare scripts in `packages/database/scripts` do not currently consume a raw `DATABASE_URL`.

They do support env-var overrides for connection pieces:

- shared: `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_SSL_MODE`
- smoke-specific: `AQUAPULSE_ALERTS_SMOKE_DB_HOST`, `AQUAPULSE_ALERTS_SMOKE_DB_PORT`, `AQUAPULSE_ALERTS_SMOKE_DB_NAME`, `AQUAPULSE_ALERTS_SMOKE_DB_USER`, `AQUAPULSE_ALERTS_SMOKE_DB_PASSWORD`, `AQUAPULSE_ALERTS_SMOKE_DB_SSL_MODE`

The same shared override pattern also works for the other smoke prepare commands:

- `corepack pnpm water-quality:smoke:db:prepare`
- `corepack pnpm feed:smoke:db:prepare`
- `corepack pnpm tasks:smoke:db:prepare`
- `corepack pnpm ponds:smoke:db:prepare`
- `corepack pnpm ponds:smoke:db:prepare:linked`

## Temporary Container-IP Workaround

Use this only if Docker Desktop host port forwarding is still broken and your current shell can reach the container IP directly.

Find the container IP:

```powershell
docker inspect -f "{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}" aquapulse-alerts-smoke-postgres
```

Check whether your current shell can reach the container on port `5432`:

```powershell
Test-NetConnection <container-ip> -Port 5432
```

Only continue if that connectivity test succeeds.

For the alerts smoke prepare flow, temporarily point the script at the container IP:

```powershell
$env:DATABASE_HOST='<container-ip>'
$env:DATABASE_PORT='5432'
$env:DATABASE_NAME='aquapulse'
$env:DATABASE_USER='aquapulse'
$env:DATABASE_PASSWORD='change-me'
$env:DATABASE_SSL_MODE='disable'
corepack pnpm alerts:smoke:db:prepare
```

You can use the same pattern for other smoke prepare commands because they read the same shared connection env vars.

If you prefer smoke-specific env names for the alerts prepare flow:

```powershell
$env:AQUAPULSE_ALERTS_SMOKE_DB_HOST='<container-ip>'
$env:AQUAPULSE_ALERTS_SMOKE_DB_PORT='5432'
$env:AQUAPULSE_ALERTS_SMOKE_DB_NAME='aquapulse'
$env:AQUAPULSE_ALERTS_SMOKE_DB_USER='aquapulse'
$env:AQUAPULSE_ALERTS_SMOKE_DB_PASSWORD='change-me'
$env:AQUAPULSE_ALERTS_SMOKE_DB_SSL_MODE='disable'
corepack pnpm alerts:smoke:db:prepare
```

## Important Limits

- Do not treat a raw `DATABASE_URL` as supported for smoke prepare scripts unless the scripts are changed later.
- Do not change the compose port mapping just to work around a transient Windows Docker issue.
- Do not apply this workaround to production or shared environments.
- Do not infer an authorization, contract, or schema defect from this symptom pattern by itself.
