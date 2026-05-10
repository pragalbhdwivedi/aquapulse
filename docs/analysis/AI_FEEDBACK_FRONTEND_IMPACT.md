# AI Feedback Frontend Impact

## Current Frontend Behavior

The alert workbench currently submits explanation feedback using:

- `alertId`
- `value`
- `note`
- `explanation`

The frontend does not currently send:

- `aiResponseId`
- `aiRequestId`

## Current Frontend Assumptions

- feedback is attached to the current alert explanation view
- the latest returned feedback is merged into `feedbackSummary.latest`
- no durable response selection or cross-history feedback UI exists

## Impact By Migration Stage

### Stage 1: durable alert-linked compatibility persistence

Frontend changes required:

- none

### Stage 2: optional `aiResponseId`

Frontend changes required:

- low to medium

Needed work:

- expose or retain durable response identity from the explanation-generation path
- include it when submitting feedback

### Stage 3: required `aiResponseId`

Frontend changes required:

- yes

Needed work:

- explanation responses or adjacent state must carry a durable response identifier
- feedback submission must send that identifier reliably

## Recommendation

Do not require frontend changes in the first durable persistence slice.

Use a compatibility model first, then add a small frontend migration when durable response identity is ready to travel through the explanation flow.
