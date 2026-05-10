# Remaining Authorization Gaps

## Highest Risks

### 1. Alerts live updates visibility model

- authenticated operator access is enforced
- assignment-scoped visibility is not enforced
- emitted websocket events include broad summary snapshots
- safe release position: keep feature disabled by default

### 2. Saved-view ownership

- saved-view routes are operator-protected
- saved views are not owned or scoped per actor
- current risk is cross-operator preset leakage rather than direct operational data mutation

### 3. Broad pond-linked mutation surfaces

- ponds create/update are not responsibility-scoped
- batches create/update are not responsibility-scoped
- attachments create/update are not parent-resource-scoped

### 4. Attachment file-content authorization

- no current byte-serving route exists
- future file-content route must reuse attachment metadata scope exactly

### 5. Placeholder generic AI mutation surfaces

- generic AI create/update routes remain operator-only
- they are lower risk than alert, audit, or pond-linked operational seams because they are not the main product path

## Notable Non-Blockers

- unsupported attachment parent types are denied safely in active auth
- audit metadata-less rows are hidden from normal active-auth operators
- local-safe remains intentionally broad and stable

## Recommended Next Hardening Order

1. alerts live updates visibility model before enabling websocket rollout broadly
2. saved-view ownership model
3. attachment write scoping through the parent-resource resolver
4. pond and batch write authority model
