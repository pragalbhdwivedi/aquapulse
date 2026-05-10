# Attachment File Access Implementation Decision

## Decision

No file-access authorization implementation is needed immediately because the repo does not currently expose an attachment byte-serving route.

## Why

- no backend route returning attachment bytes was found
- no web proxy route for attachment bytes was found
- no static-serving path for attachments was found
- no signed URL or public attachment URL field was found
- current attachment responses expose metadata only

## Reuse path for future implementation

If attachment file access is added later, it can and should reuse the existing parent-resource resolver foundation.

The safe flow is:

1. read attachment metadata by ID
2. evaluate the parent-resource resolver with `resourceType` and `resourceId`
3. only then return file bytes or a transient storage handle

## Schema and frontend impact

- schema changes are not required for that future enforcement model
- frontend changes are not required unless a new file route or UX is introduced

## Local-safe

Local-safe should remain broad for any future file route, matching the current metadata and resolver approach.

## First safe implementation slice

If a file-content route is introduced later, the first safe slice is:

- add a single protected file-content route
- make it resolve attachment metadata first
- reuse the parent-resource resolver
- return not found for out-of-scope, missing, unknown, or unsupported parent links

## Highest-risk future mistake to avoid

Do not add:

- direct public URLs
- raw storage paths
- signed URLs issued without attachment metadata scope

Those would create a byte-serving path that can drift away from the bounded metadata rule.
