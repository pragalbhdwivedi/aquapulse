# Runtime Diagnostics

AquaPulse now exposes a small diagnostics foundation for local development and staged cutover work.

## What To Use

- Web runtime page: `/runtime`
- API health endpoint: `/api/health`
- API runtime endpoint: `/api/diagnostics/runtime`

Optional local probe envs:

```env
AQUAPULSE_WEB_ENABLE_RUNTIME_PROBES=true
AQUAPULSE_WEB_RUNTIME_PROBE_TIMEOUT_MS=1500
```

When probing is enabled, the web runtime page will try to read the backend diagnostics endpoints using the local backend target already used by the alerts bridge.

## What The Diagnostics Mean

- `defaultMode`: the safe baseline the app falls back to
- `requestedMode`: what env/config asked for
- `effectiveMode`: what is actually active after safety rules are applied
- `safeFallbackActive`: whether AquaPulse stayed on the prototype-safe path

For database diagnostics:

- `configured` means DB-related env is present
- `connectivity.status = configured_only` means config exists but no live DB check was attempted
- `connectivity.status = not_attempted` means AquaPulse is only showing safe assumptions and defaults

For alerts diagnostics:

- `effectiveMode = mock` means alerts are still mock-backed
- `effectiveMode = http` means the alerts-only cutover path is active
- `transport = proxy` means alerts go through the local `/api/alerts` bridge
- `transport = direct` means alerts point at a backend URL directly

For AI alert explanations:

- `mode = fallback` means AquaPulse is using the deterministic advisory explanation path
- `mode = openai_nano` means the backend is configured to attempt a live OpenAI explanation call
- `configured = false` means the backend will keep falling back safely even if OpenAI mode was requested

These diagnostics are intentionally lightweight. They are for runtime clarity, not full monitoring or production observability.
