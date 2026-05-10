# Attachment File Access Surface Inventory

## API surfaces

Found:

- `GET /api/attachments`
  - metadata list only
  - route-protected
  - now parent-resource scoped in active auth mode
- `GET /api/attachments/:id`
  - metadata detail only
  - route-protected
  - now parent-resource scoped in active auth mode
- `POST /api/attachments`
  - metadata create placeholder path
  - not a byte-serving route
- `PATCH /api/attachments/:id`
  - metadata update placeholder path
  - not a byte-serving route

Not found:

- `GET /api/attachments/:id/download`
- `GET /api/attachments/:id/file`
- `GET /api/attachments/:id/content`
- `GET /api/attachments/:id/preview`
- `GET /api/attachments/:id/thumbnail`

## Storage and streaming surfaces

Not found:

- attachment storage service
- blob or bucket adapter
- signed URL generator
- local upload directory reader
- stream-returning attachment controller
- path-returning attachment service

## Static-serving surfaces

Not found:

- `ServeStaticModule`
- `useStaticAssets`
- attachment-specific public asset directory
- static URL mapping for attachment files

## Frontend surfaces

Found:

- attachment API client exposes only `list()` and `getById()`
- web placeholder/mock layers expose metadata only
- frontend mock data carries only `fileName`, `mimeType`, and `sizeBytes`

Not found:

- attachment preview page
- attachment download link generation
- attachment thumbnail request flow
- attachment byte proxy route under `apps/web/app/api`

## Coupling conclusion

There is no current file-access surface to couple yet.

If one is added later, it should be coupled to:

- attachment metadata lookup
- parent-resource resolver decision
- not-found masking in active auth mode
