# P1 Internal RC1 Smoke Results Template

## Session Info

- date:
- reviewer:
- environment:
- mode tested:
  - local-safe
  - active Keycloak
- build/tag:
  - `p1-internal-rc1-authz-bounded`
- commit:
  - `9c8d9f5`

## Preconditions

- [ ] using the correct RC tag or branch
- [ ] live updates backend flag is off by default
- [ ] live updates frontend opt-in is off by default
- [ ] runtime diagnostics page reachable

## Local-Safe Smoke

- [ ] dashboard loads
- [ ] alerts workbench loads
- [ ] ponds pages load
- [ ] tasks pages load
- [ ] feed pages load
- [ ] reports / AI surfaces load
- [ ] runtime diagnostics reflect local-safe or bypass state
- [ ] AI feedback works in local-safe without manual `aiResponseId` handling

Notes:

## Active Keycloak Smoke

- [ ] operator session resolves correctly
- [ ] alerts list/detail/summary look assignment-bounded
- [ ] tasks look assignee-bounded
- [ ] ponds are bounded to assigned responsibilities
- [ ] batches are bounded to readable ponds
- [ ] water-quality is bounded to readable ponds
- [ ] feed is bounded to readable ponds
- [ ] attachments metadata is bounded by readable parent records
- [ ] out-of-scope detail returns not found where expected
- [ ] water-quality/feed writes enforce pond responsibility
- [ ] task/alert generic mutations enforce bounded visibility
- [ ] AI alert explanation feedback requires and succeeds with `aiResponseId`

Notes:

## Negative Checks

- [ ] out-of-scope direct-ID reads were rejected as expected
- [ ] unauthorized bounded creates or moves were rejected as expected
- [ ] missing `aiResponseId` in active Keycloak mode failed with validation-style behavior

Notes:

## Live Updates Boundary Check

- [ ] live updates reported disabled by default
- [ ] no reviewer assumed websocket scope was production-ready

Notes:

## Outcome

- overall result: pass / pass with notes / fail
- blocker IDs:
- follow-up issue IDs:
- reviewer decision:
