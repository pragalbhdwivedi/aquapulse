# Task & Alert Mutation Rule Matrix

| Surface | Current route protection | Scoped today? | Safe now | Needs schema? | Needs role model? | Recommended timing |
|---|---|---|---|---|---|---|
| `POST /api/tasks` | auth + operator | no | require pond responsibility if `pondId` exists | no | yes for cross-user assignment | later bounded slice |
| `PATCH /api/tasks/:id` | auth + operator | no | require existing-task visibility by assignee; require new pond responsibility if `pondId` changes | no | yes for reassignment | later bounded slice |
| `POST /api/alerts` | auth + operator | no | require pond responsibility if `pondId` exists | no | yes for broader manual creation authority | later bounded slice |
| `PATCH /api/alerts/:id` | auth + operator | partial | keep existing assignment visibility; add pond validation if `pondId` changes | no | yes for assignment/review field authority | later bounded slice |
| `POST /api/alerts/:id/acknowledge` | auth + operator | yes | keep current model | no | maybe later for critical flows | keep |
| `POST /api/alerts/:id/resolve` | auth + operator | yes | keep current model | no | maybe later for critical flows | keep |
| `POST /api/alerts/:id/assign` | auth + operator | yes for current visibility only | current visibility check is safe; assignment-to-others authority still unresolved | no | yes | defer finer control |
| `POST /api/alerts/:id/unassign` | auth + operator | yes for current visibility only | current visibility check is safe | no | yes | defer finer control |
| `POST /api/alerts/:id/review-state` | auth + operator | yes for current visibility only | current visibility check is safe | no | yes | defer reviewer model |
| `POST /api/alerts/:id/attach-explanation` | auth + operator | yes | keep current model | no | no immediate extra role model | keep |
| alert bulk triage routes | auth + operator | yes | keep current model | no | maybe later | keep |
| `POST /api/ai/alerts/explain/feedback` | auth + operator | no | could require linked-alert visibility | no | not primarily | separate follow-up |

