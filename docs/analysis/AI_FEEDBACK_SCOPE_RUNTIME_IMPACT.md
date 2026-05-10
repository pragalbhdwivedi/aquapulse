# AI Feedback Scope Runtime Impact

## Runtime Impact

Runtime impact is narrow.

Changed paths:

- AI controller feedback handler
- AI application-service feedback path

Reused existing seams:

- authenticated requester extraction
- alert assignment visibility enforcement

## Blast Radius

Small.

The change affects only feedback submission for alert explanations in active authenticated mode. It does not alter AI generation, alert lifecycle handling, alert live updates, or placeholder feedback persistence.

## Frontend Impact

None at the contract level.

The frontend continues to call the same route with the same payload. In active Keycloak mode, users now receive a hidden/not-found outcome when attempting feedback on alerts they cannot see.

## Local-Safe Compatibility

Preserved.

Local-safe/mock/disabled mode still uses broad feedback behavior for development and demo flows.

## Remaining Gaps

- no durable AI response ownership enforcement
- no persistent feedback storage redesign
- no reviewer/admin review model
- no combined alert-plus-response dual validation yet

## Recommended Next Seam

If AI feedback hardening continues, the next safe seam is durable ownership linkage between feedback and stored AI response/request records so `requestedBy` can be enforced alongside linked alert visibility.
