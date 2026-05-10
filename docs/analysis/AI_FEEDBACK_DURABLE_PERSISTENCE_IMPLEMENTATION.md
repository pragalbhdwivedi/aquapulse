# AI Feedback Durable Persistence Implementation

## What Was Added

This slice adds durable persistence for:

- `POST /api/ai/alerts/explain/feedback`

The route still accepts the same alert explanation feedback payload and still returns the same response shape.

## Persistence Model

The backend now persists alert explanation feedback through a compatibility-focused durable record with:

- `alert_id`
- optional `ai_response_id`
- optional `ai_request_id`
- `submitted_by`
- `value`
- `note`
- `explanation_payload`
- timestamps

## Compatibility Behavior

- `alert_id` remains the required anchor for the live alert feedback route
- `ai_response_id` remains nullable
- `ai_request_id` remains nullable
- current frontend behavior does not need to change

## Authorization Preserved

In active Keycloak mode:

- linked alert visibility is still required before feedback is accepted
- if an optional `aiResponseId` arrives, AI response ownership is also checked

In local-safe mode:

- broad behavior is preserved

## What Stayed Deferred

- mandatory `aiResponseId`
- frontend migration
- durable AI response/request ownership as the only rule
- reviewer/admin override
- dashboards and analytics
