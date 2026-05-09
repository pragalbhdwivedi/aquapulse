# API Authorization Gaps

## High-Risk Public Gaps

### AI API

Current status:

- all AI generation routes are publicly callable at the backend
- AI history list and detail are publicly readable at the backend

Implications:

- sensitive generated operational summaries and drafts can be listed without runtime auth enforcement
- advisory-only behavior is preserved, but confidentiality is not strongly protected

Affected routes include:

- `GET /api/ai`
- `GET /api/ai/:id`
- `POST /api/ai/alerts/explain`
- `POST /api/ai/alerts/explain/feedback`
- `POST /api/ai/ponds/summarize`
- `POST /api/ai/handover/generate`
- `POST /api/ai/text/rewrite`
- `POST /api/ai/dashboard/query`
- `POST /api/ai/incidents/draft`
- `POST /api/ai/approvals/draft-note`

### Audit API

Current status:

- audit history routes are publicly callable at the backend
- audit create/update routes are also publicly callable

Implications:

- audit visibility is not restricted
- audit API itself is excluded from interceptor-generated audit logging

Affected routes:

- `GET /api/audit`
- `GET /api/audit/:id`
- `POST /api/audit`
- `PATCH /api/audit/:id`

### Attachments And Batches

Current status:

- all attachments routes are public
- all batches routes are public

Implications:

- supporting domain data has no meaningful backend authorization boundary
- future persistence hardening would increase exposure unless auth is tightened too

## Medium-Risk Partial Gaps

### Alerts

Protected:

- list
- summary
- detail
- lifecycle/triage/bulk actions
- saved-view mutations

Not protected:

- `POST /api/alerts`
- `PATCH /api/alerts/:id`
- `GET /api/alerts/views`
- `POST /api/alerts/:id/attach-explanation`

### Ponds And Tasks

- list routes are public
- detail/create/update routes are protected

This is acceptable for bounded rollout work, but it is still partial enforcement rather than domain-level protection.

## Missing Role Granularity

There are no backend route checks today for:

- admin-only
- reviewer-only
- supervisor-only
- owner-only
- assignee-only

Everything protected today effectively means “operator can do it.”

## Missing Ownership Validation

No backend enforcement was found for:

- only assigned operator may update task
- only assigned operator may triage alert
- only owner may mutate saved view
- only originating user may access AI history item

## Safest Hardening Opportunity

The safest next hardening seam is:

- AI history and generation routes

Reason:

- the surface is sensitive
- the contracts are already stable
- hardening can likely be done with bounded auth metadata rather than redesign
