# Alert Live Updates Scope Review

## Current Behavior

Live-updates today are intentionally separate from the HTTP read-scope model:

- `GET /api/alerts/live-updates/session` issues bootstrap state and ephemeral tickets
- websocket acceptance distinguishes authenticated vs local-bypass subscription state
- emitted events are broadcast to all connected websocket clients

There is no per-user alert scope filter on emitted events.

## Why This Matters

If HTTP alert visibility narrows but websocket fanout stays broad:

- live-updates can reintroduce cross-scope visibility
- queue state can appear inconsistent between initial load and later events

## Can This Be Safely Solved In The First Alert Scope Pass?

No.

The current live-updates seam needs a dedicated follow-up if AquaPulse wants scoped websocket delivery, because that requires:

- aligning subscription identity with alert scope
- deciding whether filters are per-user, per-pond, or per-role
- handling reconnect/bootstrap consistency

## Immediate Recommendation

Leave live-updates untouched in the first HTTP alert scoping pass.

If HTTP scoping is implemented first, treat websocket scope as an explicitly deferred follow-up seam.

## Local-Safe Note

Local-safe websocket behavior should remain broad and unchanged until a dedicated live-updates scope session exists.
