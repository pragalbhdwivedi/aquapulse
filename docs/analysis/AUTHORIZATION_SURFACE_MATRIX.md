| Surface | Status | Active Keycloak behavior | Local-safe behavior | Coupling | Risk |
| --- | --- | --- | --- | --- | --- |
| AI routes | protected | operator auth required | broad local operator path | history list/detail coupled by `requestedBy` | low |
| AI history list/detail | scoped | requester-owned only | broad | coupled | low |
| AI feedback | scoped | linked alert visibility + owned `aiResponseId` required | broad | route coupled to alert visibility and response ownership | low |
| Audit routes | protected | operator auth required | broad local operator path | reads coupled; mutation restricted | low |
| Audit history list/detail | scoped | actor-owned only; metadata-less rows hidden | broad | coupled | low |
| Audit mutation | restricted | forbidden for ordinary operators | broad | create/update coupled | low |
| Alerts routes | protected | operator auth required | broad local operator path | list/detail/summary/triage coupled by assignment | low |
| Alert reads | scoped | assignment-scoped | broad | coupled | low |
| Alert generic create/update | scoped | current visibility + pond checks | broad | update coupled to read scope | low |
| Alert triage routes | scoped | existing alert must be visible by assignment | broad | coupled | low |
| Alert saved views | partially protected | operator-only but not owner-scoped | broad | no ownership coupling | medium |
| Alert live updates bootstrap | intentionally broad auth surface | ticket or bearer operator auth only | bypass/local ticket path | not coupled to alert read scope | high if enabled |
| Attachments routes | protected | operator auth required | broad local operator path | metadata list/detail coupled by parent resolver | medium |
| Attachment metadata reads | scoped | parent-readable only; unknown parents hidden | broad | coupled | low |
| Attachment writes | partially protected | operator-only, no parent scope on write | broad | no parent-write coupling yet | medium |
| Batches routes | protected | operator auth required | broad local operator path | list/detail coupled by pond responsibility | medium |
| Batch reads | scoped | readable `pondId` only | broad | coupled | low |
| Batch writes | partially protected | operator-only, no pond mutation scope | broad | no write coupling yet | medium |
| Ponds routes | protected | operator auth required | broad local operator path | list/detail coupled by responsibility | medium |
| Pond reads | scoped | readable ponds only | broad | coupled | low |
| Pond writes | partially protected | operator-only, no responsibility check | broad | no write coupling yet | medium |
| Water-quality routes | protected | operator auth required | broad local operator path | list/detail and create/update coupled by pond responsibility | low |
| Feed routes | protected | operator auth required | broad local operator path | list/detail and create/update coupled by pond responsibility | low |
| Tasks routes | protected | operator auth required | broad local operator path | list/detail and update coupled by assignee visibility | low |
| Task reads | scoped | assignee-only | broad | coupled | low |
| Task create/update | scoped | assignee visibility + pond check where applicable | broad | update coupled to read scope | medium-low |
| Diagnostics runtime | protected | authenticated operator required | broad local operator path | no ownership seam needed | low |
| Saved views overall | intentionally deferred | protected but shared | broad | no owner seam | medium |
| Live updates overall | intentionally deferred | authenticated operator subscription, not assignment-scoped | bypass/local compatible | not coupled to read scope | high if enabled |
