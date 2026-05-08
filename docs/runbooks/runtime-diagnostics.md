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
- `connectivity.status = reachable` means the API boot-time DB readiness check succeeded
- `connectivity.status = unreachable` means the API attempted a boot-time DB readiness check and it failed

For alerts diagnostics:

- `effectiveMode = mock` means alerts are still mock-backed
- `effectiveMode = http` means the alerts-only cutover path is active
- `transport = proxy` means alerts go through the local `/api/alerts` bridge
- `transport = direct` means alerts point at a backend URL directly
- `requestedMode` shows what the web config asked alerts to do
- the runtime page now distinguishes alerts surfaces by exposure:
  `backend_protected` for auth-enforced list/detail/summary reads, and `ui_guarded` for operator
  controls that remain visible but auth-aware

For backend alerts adapter diagnostics:

- `alerts.requestedAdapter` shows whether the API was asked to use `in-memory` or `postgres`
- `alerts.effectiveAdapter` shows what the alerts module actually selected
- `alerts.cutoverActive = true` means the alerts module is actively using the Postgres-backed adapter
- `alerts.localBridgeExpectedPath = /api/alerts` is the queue/workbench bridge path
- `alerts.localAiExplainBridgeExpectedPath = /api/ai/alerts` is the advisory explanation bridge path

For backend water-quality adapter diagnostics:

- `waterQuality.requestedAdapter` shows whether water-quality was asked to use `in-memory` or `postgres`
- `waterQuality.effectiveAdapter` shows what the water-quality module actually selected
- `waterQuality.cutoverActive = true` means water-quality is actively using the Postgres-backed adapter

For frontend water-quality runtime diagnostics:

- `waterQuality.requestedMode` shows whether the web app asked water-quality to stay `inherit`, use `mock`, or use `http`
- `waterQuality.effectiveMode = http` means the water-quality-only cutover path is active on the web side
- `waterQuality.targetLabel = /api/water-quality local bridge` means the pond detail flow is using the local Next bridge

For AI alert explanations:

- `mode = fallback` means AquaPulse is using the deterministic advisory explanation path
- `mode = openai_nano` means the backend is configured to attempt a live OpenAI explanation call
- `configured = false` means the backend will keep falling back safely even if OpenAI mode was requested

For AI operator assistance:

- `aiOperatorAssistance.mode = fallback` means daily farm summary, shift handover, dashboard assistant, incident rewrite, and approval note draft are running on the deterministic backend fallback path
- `aiOperatorAssistance.mode = openai_nano` means the backend is configured to attempt the provider-backed Responses path
- `aiOperatorAssistance.fallbackActive = true` means AquaPulse is intentionally staying on the safe degraded advisory path
- `aiOperatorAssistance.supportedTasks` lists the currently bounded operator-assistance surfaces exposed in this branch

These diagnostics are intentionally lightweight. They are for runtime clarity, not full monitoring or production observability.
