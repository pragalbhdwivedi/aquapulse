# Tasks Read-Scope Audit

## Goal

Assess whether AquaPulse task reads can be safely scoped without changing runtime behavior, shared contracts, or schemas.

## Current Read Surfaces

- `GET /api/tasks`
  - Current behavior: broad list read.
  - Current route protection: not decorated with `@RequireAuthentication()` or `@RequireRoles("operator")`.
  - Current filtering options: `assigneeId`, `pondId`, `status`, `search`.
- `GET /api/tasks/:id`
  - Current behavior: single-record read.
  - Current route protection: bounded operator protection already present.
  - Current lookup behavior: direct by id, no ownership or scope validation.

## Current Data Available For Scoping

Available fields on `TaskSummary` and the `tasks` table:

- `id`
- `title`
- `status`
- `assigneeId`
- `pondId`
- `createdAt`
- `updatedAt`

Not available:

- `createdBy`
- `requestedBy`
- `ownerId`
- reviewer/supervisor ownership
- pond membership / pond responsibility mapping

## Current Access Behavior

### Backend

- `TasksApplicationService.list()` passes queries through unchanged.
- `TasksApplicationService.getById()` passes ids through unchanged.
- `PostgresTasksRepository.list()` supports optional filtering, but only when the caller explicitly supplies a filter.
- `PostgresTasksRepository.getById()` always returns the matching row with no scope check.
- `InMemoryTasksRepository` mirrors the same broad behavior.

### Frontend

- The tasks page loads an unfiltered pending-work list.
- It immediately uses the first visible item as the task-detail entry point.
- The create/update flows refresh task lists by `pondId`, not by assignee.
- The page copy currently describes a shared pending-work queue rather than a personal inbox.

## Sensitivity Assessment

Task data is operational rather than deeply confidential, but it still carries meaningful workflow signals:

- who is assigned to follow-up work
- which pond is linked to a task
- which tasks are still open, done, or cancelled
- what the team is actively working on

This is less sensitive than audit history, but more operationally significant than AI history.

## Read-Scope Maturity

- Current maturity: low-to-moderate
- Existing scope controls: query-capable but caller-driven only
- Effective enforcement: none

## Safest Scope Model

The safest eventual model is **mixed**, not pure assignee-only:

- assignee-scoped visibility for clearly personal follow-up work
- pond-scoped visibility for operators responsible for a pond
- elevated review visibility for supervisors only if/when that role is formally modeled

## Can It Be Safely Enforced Without Schema Change?

Not fully.

What is possible without schema changes:

- assignee-based filtering
- pond-based filtering
- list/detail coupled enforcement once a rule is chosen

What is not possible without schema or product-model changes:

- reliable pond responsibility checks
- creator/requester fallback visibility
- supervisor review visibility
- admin-style override semantics
- safe handling for unassigned tasks

## Core Conclusion

Task reads should **not** be hardened the same way AI history was hardened.

AI history had a clear owner field (`requestedBy`) and low ambiguity.
Tasks do not.

The repo can technically filter by `assigneeId` or `pondId`, but the correct business rule is still unresolved. Applying a narrow filter too early would likely hide legitimate shared operational work.
