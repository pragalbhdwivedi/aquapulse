# Write-Scope Regression Review

## Stable Bounded Write Seams

- audit public mutation remains blocked in active Keycloak mode
- water-quality create/update remains pond-responsibility-scoped
- feed create/update remains pond-responsibility-scoped
- task create/update remains bounded by current task visibility and pond responsibility where applicable
- generic alert create/update remains bounded by current alert visibility and pond responsibility where applicable
- alert triage and bulk triage remain bounded by alert assignment visibility
- AI feedback remains bounded by linked alert visibility and owned `aiResponseId` in active auth

## Existing Mutation Bypass Review

No regression was found where a previously hardened mutation seam lost its scope check.

The remaining broad write seams are still the expected deferred ones:

- pond create/update
- batch create/update
- attachment create/update
- generic AI create/update placeholder routes
- alerts saved-view create/remove

## Error Behavior Consistency

The write seams still follow the intended bounded pattern:

- out-of-scope existing record mutation: `not found`
- create into unauthorized target scope: `forbidden`
- missing required linkage for active-auth AI feedback: validation-style error

## Highest Remaining Write Risks

- pond writes are still ordinary operator mutations
- batch writes are still ordinary operator mutations
- attachment writes are still ordinary operator mutations and do not yet reuse the parent-resource resolver
- saved views remain shared across operators
