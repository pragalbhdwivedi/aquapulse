# AI Gateway Audit

## AI Strategy In Use
- Backend-first
- Structured outputs
- Deterministic fallback by default
- Optional provider-backed OpenAI path
- Advisory-only output model
- Request/response logging seam exists

## Implemented AI Surfaces
- Alert explanation
- Daily farm summary
- Shift handover
- Dashboard assistant
- Incident rewrite
- Approval note draft
- Incident draft
- AI history read/review
- AI reuse-from-history
- AI compare-from-history

## Backend AI Implementation State

### Implemented
- `AlertExplanationService`
- `OperatorAssistanceService`
- request/response schema validation
- runtime diagnostics for AI modes
- deterministic fallback generation
- optional OpenAI Responses-style provider clients

### Partially Implemented
- AI repository port is broad and future-facing
- in-memory AI repo is usable for local/runtime demos
- Postgres AI repo is placeholder-backed rather than DB-backed

### Placeholder
- `packages/ai/src/index.ts` exports only `AiPackagePlaceholder`
- shared package-level AI runtime library has not been built out

## Logging / Audit State

### Real
- AI services call `saveRequestRecord` and `saveResponseRecord`
- history surface reads request/response logs
- metadata includes provider mode/path and advisory-only flags

### Limited
- In-memory repo does not persist state durably
- Postgres AI repo does not currently query real tables
- audit coverage is AI-log oriented, not a full compliance pipeline

## Safety Posture
- Strong safety boundary:
  - no direct critical write authority
  - outputs remain advisory-only
  - fallback path works without live OpenAI
- Good runtime visibility:
  - provider vs fallback
  - supported tasks
  - output mode support

## AI Integration Gaps
- No real Postgres persistence layer for AI log tables
- No true prompt-template storage backend
- No action-draft persistence backend
- No generalized shared `packages/ai` implementation
- No broader multi-model or routing framework

## Production-Safe Assessment
- AI interaction model: safe
- AI persistence model: incomplete
- AI advisory UX: implemented

## Dangerous To Modify
- `OperatorAssistanceService`
- `AlertExplanationService`
- AI DTO/mappers/shared schemas
- web reports/history/reuse/compare flow

Reason:
- These files align multiple AI tasks, validation, history, and safety semantics.

## Summary
AI is more implemented than the placeholder package suggests. The runtime gateway is real and carefully bounded. The weak point is persistence maturity, not advisory-generation behavior.
