# AI Feedback Persistence Runtime Impact

## Runtime Impact

Runtime impact is narrow and isolated to the AI feedback path.

Changed areas:

- AI feedback persistence schema
- AI repository support
- AI application-service feedback persistence path

Unchanged areas:

- AI generation behavior
- AI history read scope
- alert lifecycle and triage behavior
- frontend contracts and UI

## Blast Radius

Small.

The live route still returns the same response contract and still uses the same linked-alert scope seam. The main runtime addition is a durable write to `ai_feedback` when persistence adapters are active.

## Local-Safe Compatibility

Preserved.

In-memory/local flows still work, and local-safe remains broad. Durable persistence can coexist with local mode when Postgres adapters are enabled, but local compatibility does not depend on them.

## Remaining Gaps

- current route still does not require `aiResponseId`
- explanation feedback is still primarily alert-linked, not response-owned
- generic AI feedback records and alert explanation feedback remain separate seams

## Next Safe Seam

The next safe seam is additive route/frontend support for optional then required `aiResponseId`, followed by dual enforcement of:

- linked alert visibility
- AI response ownership
