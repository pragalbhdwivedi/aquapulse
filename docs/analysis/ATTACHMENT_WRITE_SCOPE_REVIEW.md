# Attachment Write Scope Review

## Surfaces

- `POST /api/attachments`
- `PATCH /api/attachments/:id`

## Current behavior

- authenticated and operator-role protected
- no parent-resource mutation check
- application service directly delegates to repository write methods

## Scope foundation available

The repo now has `ParentResourceScopeResolverService`, which is the correct future seam for attachment write authorization.

## Current blocker

The current mutation DTO seam is too thin:

- `CreateAttachmentsDto` only has `id?`
- `UpdateAttachmentsDto` only has `id?`

The controller/service mutation path does not expose a stable `resourceType` and `resourceId` payload that can be validated before writing.

## Sensitivity

High, because attachments should inherit parent-resource visibility and eventually file-access rules.

## Enforcement readiness

Not safe now.

## Recommendation

- defer attachment write scoping
- when the mutation seam carries stable parent-link data, require parent-resource visibility on create
- for update, validate both current parent visibility and new parent visibility if the parent can change

## Frontend impact risk

Low today. The web API client does not expose attachment create/update.

