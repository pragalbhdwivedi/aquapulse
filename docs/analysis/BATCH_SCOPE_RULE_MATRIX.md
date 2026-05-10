| Rule | Can support now without schema change | Requires schema change | Requires pond-responsibility mapping | Requires role expansion | Notes |
| --- | --- | --- | --- | --- | --- |
| Broad operator batch list/detail in local-safe | Yes | No | No | No | Current safe development behavior |
| Batch list filtered by caller-supplied `pondId` query | Yes | No | No | No | Technical filter exists, but it is not authorization |
| Batch reads inherit from pond scope | No | No | Yes | No | Safest future model |
| Batch detail hidden when pond is out of scope | No | No | Yes | No | Detail must not bypass list scope |
| Batch reads scoped by creator identity | No | Yes | No | No | No surfaced `createdBy` field exists |
| Batch reads scoped by assigned operator | No | Yes or model support | Yes | Possibly | No operator-to-batch or operator-to-pond ownership mapping exists |
| Supervisor/admin cross-pond visibility | No | No direct schema required | Yes | Yes | Requires explicit role model, intentionally deferred |
| Pond-manager visibility across assigned ponds | No | No direct schema required | Yes | Likely yes | Needs authenticated pond membership or responsibility mapping |

## Immediate conclusion

Batch scoping is not safely enforceable yet in authenticated production mode because the repo lacks the mapping from current operator identity to allowed `pondId` values.

## Safe deferred model

- define pond responsibility first
- derive allowed `pondId` values for the authenticated operator
- apply the same pond rule to both batch list and batch detail
