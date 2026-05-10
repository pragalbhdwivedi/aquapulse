# Safe Scope Hardening Plan

## Guiding Principle

Do not start with the most sensitive surface.

Start with the surface that already has:

- a durable scope field
- repository filtering support
- low blast radius
- clear user expectations

## Safe Implementation Order

### Phase 1

AI history read scoping by `requestedBy`

Why first:

- persistence already stores `requested_by`
- repository filtering already supports it
- the surface is sensitive enough to matter
- the behavior change can be explained simply

### Phase 2

Tasks list scoping by `assigneeId` and optional `pondId`

Why next:

- fields already exist
- list semantics are easier than audit or saved-view semantics

### Phase 3

Batches read scoping by `pondId`

Why here:

- technically straightforward
- naturally pond-scoped

### Phase 4

Alerts scope design

Why after tasks/batches:

- alerts need a policy decision between assignment visibility, pond visibility, and review visibility
- saved views still need ownership modeling

### Phase 5

Audit history role-scope design

Why late:

- most sensitive authenticated read surface
- better handled after reviewer/admin read intentions are explicit

### Phase 6

Attachments inheritance-based scope model

Why last:

- attachment scope should follow parent-resource visibility
- attachment-only ownership would be incomplete

## Surfaces Safe To Harden Without Schema Change

- AI history
- tasks list
- batches list
- parts of alerts queue/detail

## Surfaces Likely Requiring Schema Change

- saved alert views
- attachment ownership or inheritance metadata
- any formal pond-responsibility membership model
- any durable reviewer/admin sharing model

## What Not To Touch Yet

- auth internals
- websocket/live-updates seams
- runtime diagnostics behavior
- shared contracts
- persistence schemas in a scope-only session unless explicitly planned

## Failure Modes To Avoid

- filtering list endpoints without filtering detail endpoints
- scoping by user when the real rule should be pond or review role
- hiding farm-wide summary artifacts without product agreement
- introducing scope rules that frontend flows are not prepared to explain
