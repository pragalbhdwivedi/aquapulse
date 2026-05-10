# AI Response Linkage Test Plan

## Stage 1 Tests

- explanation response can include optional `aiResponseId`
- feedback route accepts payloads with and without `aiResponseId`
- when `aiResponseId` is present and owned, feedback succeeds
- when `aiResponseId` is present but not owned, feedback returns not found
- linked alert visibility still applies regardless of `aiResponseId`
- local-safe remains broad

## Stage 2 Tests

- frontend preserves returned `aiResponseId` in explanation state
- frontend sends `aiResponseId` during feedback
- HTTP client and mock adapter parity still hold
- alerts workbench feedback still updates `feedbackSummary.latest`

## Stage 3 Tests

- active auth rejects alert feedback without `aiResponseId`
- active auth requires both linked alert visibility and response ownership
- local-safe still allows compatibility flows

## Regression Coverage To Preserve

- AI generation tests
- AI history read-scope tests
- linked-alert feedback scope tests
- contract tests across web and api
