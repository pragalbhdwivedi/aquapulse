# Task Mutation Scope Review

## Surfaces

- `POST /api/tasks`
- `PATCH /api/tasks/:id`

## Current behavior

- both routes use `@RequireAuthentication()` and `@RequireRoles("operator")`
- controller mutation paths do not pass requester scope into the application service
- application service directly calls repository `create(...)` and `update(...)`
- there is no mutation visibility check

## Current read relation

Task reads are already assignee-scoped in active Keycloak mode:

- list forces `assigneeId = requester.id`
- detail uses a scoped repository list by `taskId + assigneeId`

That means write authority is currently broader than read authority.

## Available fields today

- create:
  - `title`
  - `assigneeId?`
  - `pondId?`
- update:
  - `title?`
  - `status?`
  - `assigneeId?`
  - `pondId?`

Unassigned tasks exist today, so the product model is not “all tasks always belong to exactly one assignee.”

## What is safe now

- task update can safely require existing-task visibility under the current assignee rule
- if update changes `pondId`, new pond responsibility can also be checked
- task create can safely require pond responsibility when `pondId` is present

## What is not safe yet

- allowing ordinary operators to create tasks assigned to other users
- allowing ordinary operators to reassign tasks to other users
- defining supervisor/admin cross-operator task management

These are role-model questions, not just scope-check questions.

## Recommendation

- initial task mutation slice should be:
  - create: pond responsibility when `pondId` exists
  - update: existing-task visibility by assignee, plus new pond responsibility if `pondId` changes
- defer cross-user assignment authority

## Frontend impact expectation

Moderate. Task create and update are active frontend flows.

