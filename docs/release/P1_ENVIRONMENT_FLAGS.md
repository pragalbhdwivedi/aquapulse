# P1 Environment Flags

## Required Baseline Principle

For the bounded internal release candidate, keep live updates disabled unless there is an explicit controlled verification need.

## Core Release Flags

### Live Updates

Keep unset or falsy by default:

```env
AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES=
NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES=
```

Only explicit opt-in enables them:

```env
AQUAPULSE_ENABLE_ALERTS_LIVE_UPDATES=true
NEXT_PUBLIC_AQUAPULSE_WEB_ALERTS_LIVE_UPDATES=true
```

### Active Keycloak Verification

Use your normal bounded Keycloak env set when verifying active-auth behavior. Reviewers should expect:

- operator auth required
- bounded read/write scopes enforced
- AI alert feedback requires `aiResponseId`

### Local-Safe Verification

Keep normal local-safe defaults for:

- demos
- fallback verification
- smoke where full auth is not the test goal

## Reviewer Checklist

- [ ] live updates backend flag is off by default
- [ ] live updates frontend opt-in is off by default
- [ ] active Keycloak verification env is available for one bounded pass
- [ ] local-safe verification env is available for one broad compatibility pass

## Notes

- changing live-updates flags is not part of normal bounded rollout
- do not enable websocket rollout broadly as part of this P1 handoff
