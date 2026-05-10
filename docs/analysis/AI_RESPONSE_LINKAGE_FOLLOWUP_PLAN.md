# AI Response Linkage Followup Plan

## Current State

Durable feedback persistence now supports nullable:

- `ai_response_id`
- `ai_request_id`

But the live alert explanation feedback route does not require either one yet.

## Followup Goal

Move from compatibility persistence to durable response-linked ownership without breaking the current alert workbench flow.

## Recommended Steps

1. Expose durable explanation response identity in the explanation-generation path.
2. Add optional `aiResponseId` to the frontend feedback submission flow.
3. Preserve backward compatibility while mixed records still exist.
4. Enforce AI response ownership by `requestedBy` whenever `aiResponseId` is present.
5. Later require `aiResponseId` once frontend rollout is complete.

## Rules At The Target State

For alert explanation feedback:

- require linked alert visibility
- require AI response ownership when `aiResponseId` is present
- eventually require both on every durable feedback submission

## What To Avoid

- do not make `aiResponseId` mandatory before the frontend can send it
- do not replace linked-alert visibility with response ownership alone
- do not combine reviewer/admin workflows into the same rollout
