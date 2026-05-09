# AI And Audit Authorization Review

## AI Surface

### Runtime State

AI generation and history flows are real, persisted, and advisory-only.

Authorization state:

- backend AI routes are not protected by auth metadata
- no role check is required for generation
- no role check is required for history visibility
- no ownership check is required for history item access

### Weak Points

- AI history can expose generated summaries, drafts, and related record IDs
- feedback submission is also public
- “advisory-only” reduces write risk, but not read-access risk

### Current Classification

- partially safe operationally
- weak from a confidentiality/authorization standpoint

## Audit Surface

### Runtime State

Audit persistence is now durable, but audit API authorization is weak.

Authorization state:

- audit list/detail/create/update routes are public
- audit route traffic is skipped by the interceptor to avoid recursive self-logging

### Weak Points

- audit history is readable without operator/admin restriction
- audit create/update routes are callable without role checks
- there is no special protection for audit-sensitive data access

### Current Classification

- persistence is stronger than authorization

## Comparative Risk

### Higher Risk Today

- `audit`
- `ai`

Reason:

- both hold sensitive operational meta-information
- both are more weakly protected than feed/water-quality

## Safe Hardening Recommendation

If only one seam is hardened next, harden:

1. `ai`
2. `audit`

in that order if operator-facing confidentiality is the main concern,
or in reverse order if internal compliance visibility is the main concern.
