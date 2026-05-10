# Task Local-Safe Behavior

## Final Decision

Local-safe mode should keep broad task visibility.

## Why

The repo already uses local-safe and mock modes for:

- reviewer walkthroughs
- demo readiness
- bounded protected-read explanations
- predictable task page rendering

The current tasks page expects:

- a visible pending-work list
- a selected first task detail
- readable create/update refresh behavior

Changing local-safe task visibility would reduce clarity during demos and make degraded-vs-authenticated behavior harder to explain.

## Active Authenticated Mode vs Local-Safe Mode

### Active authenticated mode

Recommended future behavior:

- scoped task list
- scoped task detail
- no broad shared queue by default

### Local-safe mode

Recommended continuing behavior:

- broad shared queue remains
- first-task detail example remains
- no additional visibility hardening

## Conclusion

This split is consistent with other bounded AquaPulse seams:

- production-like active auth gets narrower enforcement
- local-safe mode stays broadly readable for stable development and demos
