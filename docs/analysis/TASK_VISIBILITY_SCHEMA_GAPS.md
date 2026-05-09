# Task Visibility Schema Gaps

## Existing Fields Relevant To Visibility

- `assignee_id`
- `pond_id`
- `status`
- `created_at`
- `updated_at`

## Missing Fields Or Models

### Creator / Requester Identity

Missing today:

- `created_by`
- `requested_by`
- `submitted_by`

Impact:

- cannot support “created by me” visibility
- cannot support creator fallback when assignment is blank

### Pond Responsibility Model

Missing today:

- pond-to-user responsibility mapping
- pond manager membership model
- operator-to-pond assignment model

Impact:

- cannot safely support pond-scoped task visibility
- cannot safely support unassigned tasks limited to responsible operators

### Role Model For Broader Visibility

Missing today:

- explicit task supervisor role semantics
- admin/owner runtime enforcement semantics
- accountant/task-category linking

Impact:

- cannot cleanly implement broader review visibility
- cannot safely separate operational tasks from finance/inventory tasks

### Task Classification

Missing today:

- task category
- task domain
- review type / escalation type

Impact:

- cannot support accountant-only or reviewer-specific task scope
- cannot distinguish operational pond tasks from back-office tasks

## Schema Gap Conclusion

Phase one task read scoping can proceed without schema changes **only** if the model is based on `assigneeId`.

Any richer model needs:

- creator support
- pond responsibility mapping
- broader role semantics
- likely task classification metadata
