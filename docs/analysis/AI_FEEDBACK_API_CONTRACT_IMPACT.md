# AI Feedback API Contract Impact

## Current Contract

The live frontend and API contract for alert explanation feedback is:

- request: `alertId`, `value`, `note`, `explanation`
- response: alert-scoped feedback summary fields

This contract does not include:

- `aiResponseId`
- `aiRequestId`

## Immediate Compatibility Decision

The current route should remain backward-compatible for the first durable persistence slice.

That means:

- no required contract change at the start
- `alertId` remains required
- `aiResponseId` can only be optional initially if introduced additively

## Contract Options

### No contract change yet

Pros:

- zero frontend disruption
- allows durable storage of alert-linked feedback only

Cons:

- cannot enforce AI response ownership yet

### Add optional `aiResponseId`

Pros:

- backward-compatible
- enables mixed migration mode

Cons:

- still leaves some feedback rows without response linkage during migration

### Require `aiResponseId`

Pros:

- strongest durable ownership model

Cons:

- breaks current clients
- requires coordinated frontend rollout

## Recommendation

Short term:

- keep current route backward-compatible
- if contract evolution is needed, add optional `aiResponseId` first

Later:

- require `aiResponseId` once frontend explanation flows can reliably send it

## Required API Changes

- no required API contract change for the first durable persistence slice if persistence starts as alert-linked compatibility mode
- required API contract change later if response-linked ownership is made mandatory
