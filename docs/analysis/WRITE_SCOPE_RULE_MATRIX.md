# Write Scope Rule Matrix

| Surface | Current auth | Current scope | Target field(s) | Safe future model | Implement now? | Main blocker |
|---|---|---|---|---|---|---|
| `POST /api/ponds` | auth + operator | none | n/a | owner/admin/supervisor or pond-manager later | No | needs role model |
| `PATCH /api/ponds/:id` | auth + operator | none | pond record itself | owner/admin/supervisor or pond-manager later | No | needs role model |
| `POST /api/batches` | auth + operator | none | no stable pond target in current DTO | pond responsibility later | No | DTO/product-model gap |
| `PATCH /api/batches/:id` | auth + operator | none | no stable mutable target in current DTO | current-batch pond validation later | No | DTO/product-model gap |
| `POST /api/water-quality` | auth + operator | none | `pondId` | require pond responsibility for target pond | Yes | none beyond bounded implementation |
| `PATCH /api/water-quality/:id` | auth + operator | none | existing `pondId`, optional new `pondId` | require current-record pond responsibility, plus new target if changed | Yes | none beyond bounded implementation |
| `POST /api/feed` | auth + operator | none | `pondId`, `batchId` | require pond responsibility for target pond | Yes | none beyond bounded implementation |
| `PATCH /api/feed/:id` | auth + operator | none | existing record `pondId` | require current-record pond responsibility | Yes | none beyond bounded implementation |
| `POST /api/attachments` | auth + operator | none | parent link not stably exposed here | require parent-resource visibility | No | DTO seam too thin |
| `PATCH /api/attachments/:id` | auth + operator | none | parent link not stably exposed here | require current and new parent visibility | No | DTO seam too thin |
| `POST /api/tasks` | auth + operator | none | `assigneeId`, `pondId` | task-write ownership model later | No | unclear create ownership semantics |
| `PATCH /api/tasks/:id` | auth + operator | none | `assigneeId`, `pondId` | current-task visibility plus reassignment rules later | No | unclear reassignment authority |
| `POST /api/alerts` | auth + operator | none | `pondId`, `assignedTo` | likely internal/supervisor or stricter role later | No | needs role/product model |
| `PATCH /api/alerts/:id` | auth + operator | existing alert assignment visibility | current alert, mutable `pondId`, `assignedTo` | keep visibility gate, then refine field authority later | Not yet | needs finer role model |
| alert lifecycle / triage actions | auth + operator | assignment-scoped | alert id / assigned target | keep current assignment-scoped seam | already | n/a |
| `POST /api/audit` | auth + operator | blocked in Keycloak | actor/system audit record | keep restricted | already | n/a |
| `PATCH /api/audit/:id` | auth + operator | blocked in Keycloak | actor/system audit record | keep restricted | already | n/a |
| `POST /api/ai` | auth + operator | none | request/response scaffolding | review separately; likely not ordinary operator feature | No | product-purpose unclear |
| `PATCH /api/ai/:id` | auth + operator | none | response scaffolding | review separately; likely not ordinary operator feature | No | product-purpose unclear |
| `POST /api/ai/alerts/explain/feedback` | auth + operator | none | linked `alertId` in payload | require linked-alert visibility later | Not yet | service lacks requester seam |

## Create vs Update Rule

- Create should validate the target in the submitted payload.
- Update should validate the current record first.
- If update can retarget ownership or pond linkage, validate the new target too.

