# Alerts And Tasks Scope Review

## Alerts

### Current access behavior

- alerts routes are operator-protected
- any authenticated operator can read the full queue, summary, detail, and saved views

### Sensitivity

- high
- queue and detail include:
  - pond linkage
  - assignee
  - review state
  - latest notes
  - action history

### Scope anchors available now

- `pondId`
- `assignedTo`
- `reviewState`

### Missing anchors

- saved alert views have no owner/shared field

### Can alerts be scoped without schema change?

Partially yes.

Possible now:

- pond-scoped queue narrowing
- assignee-focused queue narrowing

Not safely complete yet:

- private/shared ownership for saved views
- clear reviewer-vs-operator queue visibility model

### Safest future model

- **mixed**
- alerts themselves: pond-scoped and/or assignment-aware
- saved views: owner/shared semantics after schema work

## Tasks

### Current access behavior

- task detail and writes are operator-protected
- task list remains broadly readable to authenticated operators

### Sensitivity

- moderate
- pending-work visibility can expose assignment and follow-up posture across the farm

### Scope anchors available now

- `assigneeId`
- `pondId`
- `status`

### Can tasks be scoped without schema change?

Yes.

Tasks are one of the cleanest scope candidates because both assignment and pond linkage already exist.

### Safest future model

- **mixed**
- “my tasks” and “my pond tasks” as the likely default operator view
- broader review visibility later for supervisor/reviewer roles

## Recommendation

After AI history, the next clean implementation seam is likely:

- task list scoping

Reason:

- natural scope fields already exist
- read semantics are easier to explain than alerts saved-view semantics
- lower risk than audit and attachment scope work
