| Rule | Can support now without schema change | Requires schema change | Requires parent-resource scope resolver | Requires file-access rule coupling | Notes |
| --- | --- | --- | --- | --- | --- |
| Broad operator attachment list/detail in local-safe | Yes | No | No | No | Current safe development behavior |
| Attachment list filtered only by `resourceType`/`resourceId` query input | Yes | No | No | No | Technical filter exists, but it is caller-controlled and not authorization |
| Attachment reads inherit from parent resource visibility | No | No direct schema required | Yes | Yes | Safest long-term model |
| Attachment detail hidden when parent is out of scope | No | No direct schema required | Yes | Yes | Detail must not bypass inherited scope |
| Attachment file-content access uses same rule as detail | No | No direct schema required | Yes | Yes | No dedicated download route exists yet, but the seam should stay unified |
| Attachment reads scoped by uploader/creator identity | No | Yes | No | Yes | No surfaced `uploadedBy` or `createdBy` field exists |
| Pond-scoped attachment reads through direct `pondId` on attachment row | No | Yes | Possibly | Yes | No direct `pondId` exists on attachment contract/row mapper |
| Batch-linked attachment reads through direct `batchId` on attachment row | No | Yes | Possibly | Yes | No direct `batchId` exists on attachment contract/row mapper |
| Supervisor/admin override visibility | No | Likely no direct schema required | Yes | Yes | Requires explicit role model, intentionally deferred |

## Immediate conclusion

No attachment authorization rule is safely enforceable now in authenticated production mode beyond existing route protection.

## Safe deferred model

- resolve the parent record first
- authorize against the parent record's scope model
- apply the same result to attachment list, detail, and any future file-content access
