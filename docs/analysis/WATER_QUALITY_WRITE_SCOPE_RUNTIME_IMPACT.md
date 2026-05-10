# Water-Quality Write Scope Runtime Impact

## Changed runtime path

- controller create path now forwards requester scope
- controller update path now forwards requester scope
- application-service create checks `canReadPond(requester, input.pondId)` before writing
- application-service update loads the existing reading and checks the current pond before writing
- if update changes `pondId`, the new pond is also checked before writing

## Unchanged runtime path

- repository contracts
- create-side alert generation
- read scopes
- local-safe broad behavior
- frontend contracts

## Risk notes

- this does not introduce a new mutation permission model
- it reuses the bounded pond read authorization seam as instructed
- the main user-visible change in Keycloak mode is that unauthorized operators now fail earlier on create/update

