# Task Mutation Scope Runtime Impact

## Changed runtime path

- task controller create now forwards requester scope
- task controller update now forwards requester scope
- task application-service create validates `pondId` through pond responsibility when present
- task application-service update validates existing-task visibility through the assignee read seam
- task application-service update validates new `pondId` if the task is retargeted

## Unchanged runtime path

- task read scope
- repository contracts
- local-safe broad behavior
- frontend contracts

## Notes

- this pass does not introduce task creator ownership
- this pass does not change cross-user assignment authority

