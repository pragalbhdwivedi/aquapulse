# Attachment File Access Scope Audit

## Summary

This audit did not find an existing AquaPulse route or service that returns attachment file bytes, file downloads, previews, thumbnails, signed URLs, local filesystem paths, or public static file URLs.

Current attachment behavior is limited to metadata-only reads and writes:

- `GET /api/attachments`
- `GET /api/attachments/:id`
- `POST /api/attachments`
- `PATCH /api/attachments/:id`

The recently added attachment metadata scope now protects metadata list and detail reads by parent-resource visibility, but there is no separate byte-serving route in the repo today.

## What exists today

- attachment metadata controller routes only
- attachment metadata application-service methods only
- attachment metadata repository rows with:
  - `id`
  - `resourceType`
  - `resourceId`
  - `fileName`
  - `mimeType`
  - `sizeBytes`

## What was not found

- `GET /api/attachments/:id/download`
- `GET /api/attachments/:id/file`
- `GET /api/attachments/:id/content`
- `GET /api/attachments/:id/preview`
- `GET /api/attachments/:id/thumbnail`
- any Nest `StreamableFile` usage for attachments
- any `sendFile`, `download`, `createReadStream`, or storage bucket access for attachments
- any web `/api/attachments` proxy route
- any signed URL or public attachment URL field exposed to the frontend
- any static file-serving configuration tied to attachments

## Current risk conclusion

Because no attachment file-content route was found, there is no current byte-serving path that bypasses attachment metadata scope.

The remaining risk is future-facing:

- if a file-content route is added later and does not first resolve attachment metadata plus parent visibility
- if storage paths or public URLs are later exposed without the same parent-resource decision

## Recommended enforcement model

If a file-content route is introduced later, active Keycloak mode should:

1. resolve attachment metadata by ID
2. apply the same parent-resource visibility decision used by metadata detail
3. return not found when the parent is unreadable, missing, unknown, or unsupported

Local-safe should remain broad.
