# Alert List And Detail Scope Review

## Current Behavior

- `GET /api/alerts` is protected but broad
- `GET /api/alerts/:id` is protected but broad
- both surfaces expose the same operational alert data set with no ownership filtering

## Available Fields For Scoping

Available today:

- `assignedTo`
- `pondId`
- `severity`
- `status`
- `reviewState`
- `createdAt`
- `updatedAt`

Missing for richer scope:

- pond responsibility mapping
- reviewer/supervisor visibility model
- admin/owner override model

## Safest Immediate Model

The safest immediate model is:

- assigned-alert scoping by `assignedTo`
- no pond-based broadening yet
- same scope rule for both list and detail

## Why List And Detail Must Move Together

If list is scoped and detail is not:

- known ids can still leak cross-queue detail

If detail is scoped and list is not:

- queue rows still leak cross-user titles, severities, pond links, assignment, and review-state signals

## Detail Protection Requirement

Yes, detail protection is required.

Out-of-scope detail should return not found so alert existence is not confirmed outside the caller’s scope.

## Risk Note

Alerts are operationally more shared than AI history or tasks. Even assigned-alert scoping changes the workbench story, so the first implementation should stay narrow and leave pond-based and critical-alert broadening for later.
