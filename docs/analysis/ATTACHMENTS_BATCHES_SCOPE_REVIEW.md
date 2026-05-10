# Attachments And Batches Scope Review

## Attachments

### Current access behavior

- backend routes are operator-protected
- list supports `resourceType`, `resourceId`, and search filters
- detail reads are broad across authenticated operators

### Sensitivity

- moderate to high
- sensitivity depends on what the attachment actually represents
- linked-record context matters more than attachment identity itself

### Scope anchors available now

- `resourceType`
- `resourceId`

### Missing anchors

- no owner/uploader field in the current surfaced model
- no direct pond or batch scope field
- no explicit inheritance rule from parent resource

### Can it be safely scoped without schema change?

Only partially.

Possible without schema change:

- narrow attachments indirectly by scoping the parent resource first

Not safe without more design:

- creator-owned attachment visibility
- reviewer-only file visibility
- mixed private/shared attachment rules

### Safest future model

- **mixed**, but primarily **inherit scope from the linked resource**

Examples:

- attachment on an alert should follow alert visibility
- attachment on a task should follow task visibility
- attachment on a pond-related record should follow pond scope

## Batches

### Current access behavior

- backend routes are operator-protected
- any authenticated operator can read all batches

### Sensitivity

- moderate
- batches are operationally important and tied to pond and stock workflows

### Scope anchors available now

- `pondId`

### Can it be safely scoped without schema change?

Yes.

The existing data model already supports pond-based narrowing.

### Safest future model

- **pond-scoped** by default
- possible supervisor farm-wide override later if the role model grows

## Recommendation

Safe implementation priority between these two surfaces:

1. batches first
2. attachments later, after parent-resource inheritance rules are documented
