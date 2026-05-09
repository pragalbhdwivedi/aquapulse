# Attachments & Batches Scope Implementation Decision

## Final recommendation

Do not implement attachment or batch read scoping yet.

That is the safest result the repo evidence supports today.

## Attachment decision

### Recommended visibility model

- attachments should eventually inherit visibility from their parent resource
- attachment list and detail should use the same parent-based rule
- any future file download or file-content access should be authorized with the same rule
- local-safe should remain broad

### Why not implement now

- there is no parent-resource authorization resolver
- there is no direct attachment owner/uploader field to use as a safe bounded fallback
- there is no dedicated direct pond/batch scope field on surfaced attachments

## Batch decision

### Recommended visibility model

- batches should eventually be pond-scoped
- batch list and detail should use the same pond-based rule
- out-of-scope detail should eventually return not found
- local-safe should remain broad

### Why not implement now

- `pondId` exists, so technical filtering is possible
- but there is no pond-responsibility mapping from authenticated operator identity to allowed ponds
- role-expanded pond visibility is also undefined

## Rules that can be implemented now

Only analysis-safe conclusions, not runtime enforcement:

- keep local-safe broad
- require list/detail coupling for any future scope change
- treat attachment file access and detail as one authorization seam
- treat batch detail and list as one authorization seam

## Rules that require schema support

- direct attachment creator/uploader ownership fallback
- direct attachment `pondId` or `batchId` row-level enforcement
- direct batch creator-owned visibility

## Rules that require pond-responsibility mapping

- any production batch pond-scoped read enforcement
- any attachment scope inherited from pond-linked parents where the parent visibility depends on pond responsibility
- any pond-manager or cross-pond operator visibility model

## Highest-risk overbroad areas

1. Attachment detail, because the current route can expose metadata for linked records across modules without any parent authorization check.
2. Any future attachment file-content route, because it would become an easy bypass if it is not coupled to metadata/detail scope.
3. Batch detail, because direct-ID access can reveal cross-pond operational data even if list filtering is added later.

## First safe implementation slice

No direct enforcement slice is recommended yet.

The next safe authorization seam is to define:

1. a reusable parent-resource scope resolver for attachments
2. a pond-responsibility model for pond-linked resources including batches

## Recommended next branch and commit

- Branch: `analysis/p1-attachments-batches-scope-inheritance-audit`
- Commit: `chore(analysis): audit attachments and batches scope inheritance boundaries`
