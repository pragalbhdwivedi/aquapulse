# Attachment File Access Risk Matrix

## Metadata detail route

- Surface: `GET /api/attachments/:id`
- Exists: yes
- Returns bytes: no
- Current protection: authenticated operator route plus parent-resource metadata scope
- Byte leak risk: low
- Future note: should remain the first gate before any byte-serving route

## Metadata list route

- Surface: `GET /api/attachments`
- Exists: yes
- Returns bytes: no
- Current protection: authenticated operator route plus parent-resource metadata scope
- Byte leak risk: low
- Future note: if file previews are ever surfaced from list items, those preview links must share the same gate

## Attachment file/download route family

- Surface: `/download`, `/file`, `/content`, `/preview`, `/thumbnail`
- Exists: no
- Current protection: not applicable
- Byte leak risk today: none
- Future risk: high if introduced without metadata lookup plus parent-resource resolver reuse

## Static or public URL exposure

- Surface: public/static URLs, signed URLs, filesystem paths
- Exists: not found
- Current protection: not applicable
- Byte leak risk today: none
- Future risk: high if URLs are emitted directly to frontend without scoped resolution

## Web proxy layer

- Surface: Next `app/api` attachment proxy
- Exists: not found
- Current protection: not applicable
- Byte leak risk today: none
- Future risk: medium if later added and pointed at a byte-serving backend route without metadata coupling

## Recommended future model

- resolve attachment metadata first
- reuse the same parent-resource resolver decision
- return not found for unreadable, missing, unknown, or unsupported parents
- preserve broad local-safe behavior
- avoid exposing raw storage paths or public file URLs for protected attachments
