# AI Response Linkage Hardening Test Plan

## Required Tests For Mandatory Active-Auth Linkage

### Backend

- feedback rejects missing `aiResponseId` in active Keycloak mode
- feedback still allows missing `aiResponseId` in local-safe mode
- feedback with owned `aiResponseId` succeeds in active Keycloak mode
- feedback with out-of-scope `aiResponseId` returns not found
- feedback still requires linked alert visibility even when `aiResponseId` is valid

### Frontend

- normal explain-to-feedback flow sends top-level `aiResponseId`
- regenerated explanation still preserves `aiResponseId`
- feedback path stays compatible when explanation has no `aiResponseId` in local/mock mode

### Contracts

- API typecheck
- web typecheck
- full contract suite

## Tests That Should Continue Passing Unchanged

- AI generation tests
- alert lifecycle tests
- local-safe compatibility tests
- existing AI response linkage frontend adoption tests

## Staging Advice

Hardening should land in one bounded slice:

1. active Keycloak rejection for missing `aiResponseId`
2. preserved local-safe/mock compatibility
3. no frontend redesign
