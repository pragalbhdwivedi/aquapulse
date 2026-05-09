# Attachment Parent-Resource Scope Review

## Current state

Attachments are modeled as linked metadata records, not as first-class user-owned records.

The current row-to-domain mapping exposes:

- `resourceType`
- `resourceId`

That is the only reliable scope anchor present today.

## What that means

The attachment row does not contain enough information on its own to answer:

- who should see it
- whether it belongs to a pond the operator manages
- whether it belongs to a task or alert assigned to the operator
- whether it is private, shared, or role-scoped

The authorization answer therefore depends on the linked parent resource.

## Parent types

The repo evidence supports a generic parent model, but not a resolved authorization model per parent type. Based on the current surface area, attachments may eventually need to inherit from parents such as:

- alerts
- tasks
- pond-linked operational records
- batch-linked operational records

This session did not find a reusable parent-scope resolver that can safely answer those questions across modules.

## Risks of enforcing too early

If attachment scoping is implemented before a parent resolver exists, the project risks:

- allowing cross-module leakage because a parent check was skipped
- hiding valid attachments because one guessed rule was applied to every parent type
- splitting list and detail behavior if one path resolves parents differently than the other

## Required future seam

The safe future seam is a parent-resource authorization resolver that can:

1. resolve the linked parent from `resourceType` and `resourceId`
2. apply the parent module's own read-scope rule
3. return a single allow/deny result reusable by attachment list, detail, and future file access

## Decision

Attachment scoping should remain deferred until that resolver exists.
