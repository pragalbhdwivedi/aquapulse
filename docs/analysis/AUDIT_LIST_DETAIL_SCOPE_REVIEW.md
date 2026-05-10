# Audit List/Detail Scope Review

## Current Surfaces

- `GET /api/audit`
- `GET /api/audit/:id`

## Current Access Behavior

Both routes are currently:

- auth-protected
- operator-protected
- broad across all authenticated operators

The application service does not scope either route today.

## Sensitivity Level

Very high.

List and detail both expose the same sensitive audit domain:

- operator actions
- resource identifiers
- route activity
- cross-module workflow traces

Because the list and detail surfaces point at the same event stream, they cannot safely use different visibility rules.

## Available Scope Field

Available now:

- `audit_event_metadata.actor_id`

Also available but secondary:

- `request_id`
- `correlation_id`
- `request_path`
- `http_method`
- `status_code`
- `resource_type`
- `resource_id`
- `created_at`

The only clear first-step ownership anchor already populated by the runtime interceptor is `actor_id`.

## Can List And Detail Be Scoped Together Without Schema Change?

Yes.

Required implementation shape later:

- list uses a metadata-aware actor filter
- detail uses the same metadata-aware actor filter
- detail returns not found if no matching actor-scoped record exists

## Why They Must Be Scoped Together

If list is scoped and detail stays broad:

- a caller who knows or guesses an audit id can still read out-of-scope history

If detail is scoped and list stays broad:

- the list still leaks event summaries, resource ids, and timing for other operators

So the correct rule is:

- one actor-based rule for both list and detail

## Current Repository Constraints

The current Postgres repository does not yet support the final scoped behavior safely because:

- `list()` only queries `audit_events`
- `getById()` only queries `audit_events`
- `getById()` returns placeholder data when the row is missing
- `list()` returns placeholder data when the result set is empty

That means future scoped detail should not simply call the current `getById()` in Keycloak mode.

Safer future implementation seam:

- either add a metadata-aware scoped repository query
- or perform a scoped list-style lookup first and only return the record when it is visible

This is the same general safety pattern already used by tasks and alerts.

## Safest Future Access Model

For the first bounded active-auth slice:

- `GET /api/audit` returns only rows whose `actor_id` matches the authenticated operator
- `GET /api/audit/:id` returns the same actor-scoped record if visible
- otherwise `GET /api/audit/:id` returns not found

## Frontend Impact Risk

Low.

Current frontend audit behavior:

- one placeholder page
- list-only query path
- no detail page
- no audit reviewer console

The main user-visible change in active auth would simply be a smaller count.

## Test Coverage Needed For Future Enforcement

- list returns only actor-owned audit events in Keycloak mode
- detail returns the record when `actor_id` matches
- detail returns not found when `actor_id` differs
- detail returns not found when metadata is missing
- local-safe list remains broad
- local-safe detail remains broad
- existing list envelope contract remains unchanged
