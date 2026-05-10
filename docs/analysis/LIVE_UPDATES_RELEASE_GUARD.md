# Live Updates Release Guard

## Release Guard Decision

Alerts live updates are disabled by default in AquaPulse and must remain that way for the bounded internal release.

The backend only enables the websocket gateway when:

- `AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES=true`

Any unset or falsy value leaves the feature off.

## What Was Verified

- backend runtime config defaults `enabled` to `false`
- backend bootstrap returns `enabled: false` and `ticketIssued: false` when the flag is not set
- runtime diagnostics already warn with `ALERTS_LIVE_UPDATES_DISABLED`
- web live-updates connector already stays disabled by default and does not connect
- explicit opt-in behavior remains unchanged when the flag is enabled

## Why This Guard Matters

Live updates are authenticated when enabled, but they are not yet assignment-scoped. Because websocket payloads can still carry broad alert summary data, default-off is part of the release boundary, not just a convenience setting.

## Release Rule

For bounded internal rollout:

- keep backend live updates off unless explicitly needed
- do not enable them by default in shared environments
- treat any enablement as a conscious exception until assignment-aware delivery exists
