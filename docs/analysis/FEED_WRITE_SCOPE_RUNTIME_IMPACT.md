# Feed Write Scope Runtime Impact

## Changed runtime path

- controller create path now forwards requester scope
- controller update path now forwards requester scope
- application-service create checks `canReadPond(requester, input.pondId)` before writing
- application-service update loads the existing feed entry and checks its pond before writing

## Unchanged runtime path

- repository contracts
- create-side alert generation
- read scopes
- local-safe broad behavior
- frontend contracts

## Risk notes

- feed update does not currently expose `pondId`, so this pass only validates the existing record pond
- if a future contract allows pond retargeting, the same old/new pond dual-check pattern should be added there too

