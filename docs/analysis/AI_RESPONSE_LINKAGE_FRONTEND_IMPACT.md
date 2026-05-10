# AI Response Linkage Frontend Impact

## Current Frontend State

The alerts workbench stores explanation responses in local UI state keyed by `alertId`.

The same stored explanation object is then sent back during feedback submission.

Because the explanation response currently has no durable response identifier, the frontend has nothing durable to preserve for feedback ownership.

## Frontend Changes Needed Later

### For Stage 2

- explanation response state must carry `aiResponseId`
- feedback submission must pass `aiResponseId`

### What does not need to change

- basic feedback interaction model
- feedback note handling
- explanation display structure

## Risk

Low to medium.

The UI already preserves explanation objects between explain and feedback steps. That means adding one more optional field is structurally straightforward, but it still requires contract and test updates.

## Recommendation

Do not change frontend behavior in the first backend-compatible rollout slice. Let the explanation response and feedback payload become additive first, then update the workbench to pass the new field.
