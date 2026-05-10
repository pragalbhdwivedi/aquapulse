# AI Feedback Response Linkage Runtime Impact

## Runtime Impact

Blast radius is very small.

Touched path:

- AI feedback application-service authorization for `POST /api/ai/alerts/explain/feedback`

Untouched paths:

- `POST /api/ai/alerts/explain`
- AI generation behavior
- alert lifecycle and triage routes
- frontend rendering and feedback UI
- feedback persistence schema

## Behavior Change Summary

### Active Keycloak Mode

Feedback now fails early when `aiResponseId` is missing.

If `aiResponseId` is present:

- linked alert visibility is checked
- AI response ownership is checked

### Local-Safe/Mock/Disabled Modes

No behavior change.

Feedback without `aiResponseId` remains allowed.

## Frontend Impact

No UI or workflow change was required because the frontend already sends top-level `aiResponseId` when available.

Older or compatibility-style flows remain safe outside active Keycloak hardening because backend compatibility is still preserved for local-safe/mock/disabled paths.

## Remaining Gaps

- no reviewer/admin override
- no dashboard/analytics layer
- no mandatory linkage outside active Keycloak mode
