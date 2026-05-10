# AI History Scope Review

## Current Access Behavior

Backend state today:

- AI generation routes are operator-protected
- AI history list and detail routes are operator-protected
- any authenticated operator can read any AI response record

Frontend implications:

- reports and AI review/reuse/compare flows assume broad availability of recent AI history

## Data Sensitivity

AI history can include:

- alert explanations
- daily summaries
- shift handovers
- dashboard assistant outputs
- incident rewrites
- incident drafts
- approval note drafts

Sensitivity level: `high`

Even though the system is advisory-only, the content can expose:

- cross-pond operational issues
- incident wording
- review-oriented notes
- linked record identifiers

## Scope Fields Available Today

Natural scoping anchors already available:

- `AiRequestRecord.requestedBy`
- `AiRequestRecord.inputPayload`
- derived `relatedRecordIds`

Common useful payload fields:

- `pondId`
- `recordId`
- `linkedPondId`
- `linkedAlertId`
- `linkedTaskId`

## What Filtering Is Already Technically Possible

### Without schema change

Possible now:

- user-owned history via `requestedBy`
- record-linked filtering via `relatedRecordIds`
- pond-scoped filtering only if the application derives it from `inputPayload`

Not safely complete yet:

- supervisor override logic
- shared-team visibility
- per-task-type scope differences

## Safest Future Enforcement Model

Recommended model:

- default to **user-owned history**
- allow future **supervisor/reviewer wider visibility**
- keep current generation endpoints operator-protected

Why this is safest:

- `requestedBy` already exists in durable storage
- repository filtering by `requestedBy` already exists
- it reduces exposure without needing schema changes

## What Would Still Need More Design

- whether farm-wide summary artifacts should remain shared
- whether shift handovers are intentionally team-visible
- whether dashboard assistant queries should be private or team-visible
- whether incident drafts tied to alerts/tasks should inherit parent-resource scope instead of creator-only scope

## Recommendation

First safe implementation seam:

- scope AI history list and detail to `requestedBy` by default

Possible later refinement:

- keep selected task types shared if product owners intentionally want that
