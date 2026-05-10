# Read-Scope Regression Review

## Stable Bounded Read Seams

- AI history list/detail remains requester-scoped by `requestedBy`
- audit history list/detail remains actor-scoped by `actor_id`
- task list/detail remains assignee-scoped
- alert list/detail/summary remains assignment-scoped
- pond list/detail remains pond-responsibility-scoped
- batch list/detail remains pond-responsibility-scoped
- water-quality list/detail remains pond-responsibility-scoped
- feed list/detail remains pond-responsibility-scoped
- attachment metadata list/detail remains parent-resource-scoped

## List/Detail Coupling Check

All intended bounded read surfaces still keep list/detail coupling:

- AI history: yes
- audit history: yes
- tasks: yes
- alerts: yes
- ponds: yes
- batches: yes
- water-quality: yes
- feed: yes
- attachments metadata: yes

The common pattern is consistent:

- active Keycloak mode narrows list queries
- direct ID reads re-check visibility
- out-of-scope detail returns not found

## Unsupported Parent Behavior

Attachment reads are still safe in active auth for unsupported or unknown parents:

- `ParentResourceScopeResolverService` returns `unknown`
- attachment list excludes those records
- attachment detail returns not found
- local-safe still allows broad behavior through `defer_local_safe_allow`

## No Read Regression Found

I did not find a bounded read seam that now leaks through direct-ID access after the recent hardening sequence.

## Read-Scope Caveats

- alert live updates are not part of the bounded read model and can still surface cross-alert summary data if enabled
- saved views are route-protected but are not a scoped read model yet
