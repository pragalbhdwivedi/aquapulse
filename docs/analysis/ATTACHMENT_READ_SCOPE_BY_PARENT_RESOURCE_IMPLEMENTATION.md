# Attachment Read Scope By Parent Resource Implementation

## Scope

This pass implements only the bounded attachment metadata read seam:

- `GET /api/attachments`
- `GET /api/attachments/:id`

It uses the internal parent-resource scope resolver and does not change upload, update, storage, or public response shapes.

## Implemented behavior

In active authenticated Keycloak mode:

- attachment list reads are narrowed to attachments whose parent resource is readable by the current actor
- attachment detail reads reuse the same parent-resource rule through the resolver
- out-of-scope detail reads return not found
- attachments with unsupported, unknown, missing, or invalid parent links are hidden

In local-safe mode:

- attachment list remains broad
- attachment detail remains broad

## Implementation seam

The attachment read path now follows this bounded pattern:

1. controller resolves a small requester scope from the current session
2. application service asks the internal parent-resource scope resolver whether each linked parent is readable
3. list reads keep only attachments whose parent decision is `allow`
4. detail reads allow `allow` and `defer_local_safe_allow`, and hide all other decisions

## What did not change

- attachment create behavior
- attachment update behavior
- file-content or download behavior
- attachment storage behavior
- frontend attachment behavior
- parent module scope logic
- public API contract shapes

## Frontend impact

Frontend contract shapes are unchanged.

The only user-visible effect in active Keycloak mode is that attachment metadata lists and details can narrow to parents the actor is already allowed to read.
