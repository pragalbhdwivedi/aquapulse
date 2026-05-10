# Safe To Modify Runtime Areas

## Safest Areas For Next Incremental Work

### Docs and runbooks
- `docs/runbooks/*`
- `docs/README.md`
- `docs/analysis/*`

### UI copy and bounded presentation polish
- page-level explanatory text
- diagnostics wording
- advisory-only/fallback/protected-state messaging

### Mock data and demo fixtures
- `apps/web/src/mocks/*`
- non-behavioral demo/readability adjustments

### New migrations for currently unmigrated supporting tables
- only if done intentionally and without changing existing core schema semantics

### Additional read-only analysis or diagnostics
- bounded audit/read-model expansion
- more explicit rollout visibility docs

## Modify Carefully

### Shared contracts
- `packages/types/src/index.ts`
- `packages/validation/src/index.ts`

Reason:
- High fan-out across API, web, tests, runtime diagnostics, and AI surfaces.

### Runtime selection/config
- `apps/web/src/clients/runtime-config.ts`
- `packages/database/src/config/*`
- API runtime diagnostics service

Reason:
- Changes can silently break local-safe defaults or bounded cutovers.

### Auth/session alignment
- `ApiAuthService`
- `CurrentSessionService`
- web auth-session/bootstrap logic

Reason:
- Small changes can desynchronize frontend gating from backend enforcement.

### Alerts live updates
- websocket subscribe rules
- bootstrap route
- client runtime config

Reason:
- This seam crosses auth, transport, diagnostics, and UI.

## Avoid Touching Until Explicitly Planned
- `apps/worker`
- `packages/ai`
- placeholder audit pipeline internals
- generic persistence adapter selection semantics
- broad root README architectural claims unless doing a docs-focused cleanup pass

## Modules That Are Safe For Incremental Product Work
- alerts UI polish
- ponds UI polish
- feed UI polish
- tasks UI polish
- reports/AI advisory UX
- runtime diagnostics wording

## Modules That Are Not Safe For Casual Refactor
- shared contracts
- auth
- AI gateway services
- database adapter factory
- live updates

## Summary
Safe next work should stay close to docs, diagnostics, presentation, bounded migrations, or tightly scoped UI flows. Cross-cutting runtime and auth code should only be changed in explicitly planned sessions.
