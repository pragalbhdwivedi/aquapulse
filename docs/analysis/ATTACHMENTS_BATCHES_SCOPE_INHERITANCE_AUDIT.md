# Attachments & Batches Scope Inheritance Audit

## Purpose

This review finalizes the safest future read-scope model for attachments and batches without changing runtime behavior, contracts, schemas, or frontend behavior.

The key question is whether either surface can move from broad authenticated operator reads to bounded scope enforcement using data the repo already has.

## Attachment Findings

### Current access behavior

- `GET /api/attachments` is protected by authenticated operator role only.
- `GET /api/attachments/:id` is protected by authenticated operator role only.
- `POST /api/attachments` and `PATCH /api/attachments/:id` are also ordinary operator routes today.
- The controller and application service do not propagate requester identity or apply scope logic.
- The Postgres and in-memory repositories return broad list and detail results.

### Current surfaced fields

The surfaced attachment model currently exposes:

- `id`
- `resourceType`
- `resourceId`
- `fileName`
- `mimeType`
- `sizeBytes`
- `createdAt`
- `updatedAt`

It does not surface:

- `uploadedBy`
- `createdBy`
- `pondId`
- `batchId`

### Parent relationship

Attachments are parent-linked rather than directly user-owned. The repo currently expresses that link through:

- `resourceType`
- `resourceId`

That means attachment visibility is best understood as inherited from the linked parent record, not from the attachment row alone.

### What the repo can and cannot prove today

The repo can prove:

- an attachment belongs to some parent resource identified by `resourceType` and `resourceId`
- attachment list filtering by `resourceType` and `resourceId` is already supported technically

The repo cannot prove:

- whether the current operator is allowed to see that parent resource
- whether all parent resource types use a common scope model
- whether a direct fallback owner/uploader model should exist for attachments

### Safe model recommendation

The safest future model is parent-inherited visibility:

- attachment list visibility should inherit from the parent resource
- attachment detail visibility should inherit from the parent resource
- any future file-content or download access should use the same rule as attachment detail
- out-of-scope detail should later use the same not-found masking pattern as other bounded reads

### Implementation conclusion

Attachment scoping should be deferred for now.

Reason:

- there is no parent-resource authorization resolver in the current repo
- there is no direct attachment ownership field that can be safely used as a bounded fallback
- applying a guessed rule now would risk either leaking data or hiding valid records incorrectly

## Batch Findings

### Current access behavior

- `GET /api/batches` is protected by authenticated operator role only.
- `GET /api/batches/:id` is protected by authenticated operator role only.
- `POST /api/batches` and `PATCH /api/batches/:id` are also ordinary operator routes today.
- The controller and application service do not propagate requester identity or apply scope logic.
- The Postgres and in-memory repositories return broad list and detail results.

### Current surfaced fields

The surfaced batch model currently exposes:

- `id`
- `name`
- `pondId`
- `species`
- `stockCount`
- `lifecycleStage`
- `createdAt`
- `updatedAt`

There is no surfaced `createdBy` field or direct operator-ownership field.

### Pond linkage

Batches are clearly pond-linked. The repository already supports list filtering by:

- `pondId`
- `lifecycleStage`
- `search`

This means pond-based filtering is technically possible without a schema change.

### What the repo can and cannot prove today

The repo can prove:

- a batch belongs to a pond through `pondId`
- list filtering by `pondId` already exists

The repo cannot prove:

- which ponds the current authenticated operator is responsible for
- whether operators should see only assigned ponds, all ponds, or some supervisor-expanded set
- whether batch detail should inherit from pond responsibility, role expansion, or both

### Safe model recommendation

The safest future batch model is pond-scoped visibility:

- batch list visibility should inherit from pond scope
- batch detail visibility should use the same pond-based rule
- out-of-scope detail should later use not-found masking
- local-safe should remain broad

### Implementation conclusion

Batch scoping should also be deferred for now.

Reason:

- technical `pondId` filtering exists
- but there is no authenticated pond-responsibility mapping in the repo to say which `pondId` values belong to a given operator
- enforcing guessed pond rules would be product-model invention, not safe hardening

## Frontend and Local-Safe Findings

### Frontend

- The web contract exposes attachment `list/getById` and batch `list/getById`.
- The web repositories only expose `batches.list`; there is no user-facing repository abstraction for attachments in `repositories/index.ts`.
- The mock adapters are broad for detail and filterable for list, which mirrors current backend behavior.
- No dedicated attachment download/content route was found in the repo.

Frontend impact risk for future enforcement is therefore moderate but manageable:

- batch list counts and detail access could change once pond scope exists
- attachment visibility could change materially once parent-resource inheritance is enforced

### Local-safe

Local-safe and mock/demo behavior should remain broad for both surfaces.

That matches the existing hardening pattern used elsewhere in the repo and avoids breaking development/demo workflows before production-grade scope infrastructure exists.

## Final Recommendation

### Attachments

- Do not implement attachment read scoping now.
- Build a parent-resource authorization resolver first.
- Couple attachment list, detail, and any future file access under the same inherited rule.

### Batches

- Do not implement batch read scoping now.
- Use `pondId` as the future scope anchor.
- Wait until the product defines and stores pond-responsibility mapping for authenticated operators.

## First Safe Implementation Slice

There is no safe read-filtering implementation slice for attachments or batches today without introducing missing authorization infrastructure.

The next safe seam is analysis/design work for:

- a parent-resource authorization resolver for attachments
- a pond-responsibility model for pond-linked resources such as batches
