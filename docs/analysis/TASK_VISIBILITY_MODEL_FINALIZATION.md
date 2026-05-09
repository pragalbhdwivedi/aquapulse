# Task Visibility Model Finalization

## Decision Summary

The bounded task visibility model is finalized as a **two-layer model**:

1. **Immediate enforceable model**
   - for the current repo, in active authenticated runtime
2. **Future richer model**
   - only after schema and role support exist

This avoids blocking progress while also avoiding a premature pseudo-RBAC design.

## Final Recommended Task Visibility Model

### Immediate Enforceable Model

In active authenticated mode, the safest bounded first-step model is:

- operators see tasks assigned to them
- cross-pond visibility exists only through direct assignment
- completed and overdue tasks remain visible only if they are assigned to that same operator
- unassigned tasks are **not automatically visible** in the first scoped implementation
- task detail follows the exact same rule as task list

This model is narrow, implementable with existing fields, and does not require new schemas.

### Future Richer Model

Use the following as the long-term product target once support exists:

- Owner
  - sees all tasks
- Admin
  - sees all tasks
- Supervisor
  - sees all tasks
  - can review cross-pond work
- Pond Manager
  - sees tasks assigned to them
  - sees tasks linked to ponds they manage
  - sees unassigned tasks for their ponds
- Data Entry Operator
  - sees tasks assigned to them
  - sees tasks created by them
  - does not see broad cross-pond tasks by default
- Accountant
  - sees finance/inventory-related tasks assigned to them
  - does not see operational pond tasks unless assigned

## Why The Immediate Model Is Narrower

The current repo does **not** yet provide enough support for the richer model:

- no creator field on tasks
- no pond responsibility mapping
- no explicit supervisor/admin task role model
- no task category field to separate finance/inventory work

Because of that, the immediate model must stay grounded in fields the repo already has:

- `assigneeId`
- `pondId`
- `status`

## Final Product Decision

The current shared pending-work queue should **not** remain the long-term active-auth model.

It should remain:

- in local-safe mode
- in mock/demo mode
- during current pre-enforcement behavior

It should not remain as the final scoped production-facing rule, because that leaves task reads broader than necessary.
