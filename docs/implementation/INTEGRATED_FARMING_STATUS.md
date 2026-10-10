# Integrated farming implementation

User-approved direction: India first, multi-farm business, full enterprise workflows, manual entry, offline capture with server-checked posting, and ERPNext/India Compliance/Frappe HR for finance. Additional countries follow customer orders.

## Baseline

- Downloaded `develop` at `56b95f6d40b3099b3851e948434ac29c59854aff`.
- Implementation branch: `feature/integrated-farming`, targeting `develop` for review.
- Initial host free space: approximately 7.31 GiB; avoid infrastructure images/model downloads here.
- Dependencies use the repository lockfile and a Git-ignored workspace-local store.

## Delivery and verification

Delivered locally: `/farming` web workspace and `/api/farming/*` API, with shared strict validation contracts; all eight enterprise groups; legal entity/farm/unit/cycle hierarchy; current server-side memberships; independent treatment and finance approvals; count and operational stock checks; task assignment/updates; scoped photo evidence; audit/export; source and harvest lots; lab, biosecurity, cold-chain and dispatch records.

Field capture uses an opt-in PWA shell and IndexedDB outbox. Stable submission UUIDs are checked transactionally, including mismatched retry conflicts. Configuration, approvals, stock movements and finance remain online. The field UI provides English controls and Hindi enterprise labels; complete Hindi translation is still outstanding.

PostgreSQL migration 0006 adds a row-locked business aggregate with a 32 MiB cap; local demo mode is explicit and memory-only. This is a bounded manual pilot architecture, not the final normalized, high-volume production design.

The ERPNext connector creates approved draft Sales/Purchase Invoices with unique provider event IDs, receipt reconciliation, leases, redacted failures and an optional worker. It does not implement or certify Indian statutory accounting/payroll. Those workflows are delegated to the chosen ERP stack and remain unconfigured here.

Verification completed during implementation:

- Baseline: 107 files / 517 contract tests passed.
- Final suite: 113 files / 553 tests passed. The optional PostgreSQL integration test was skipped in the default run, then run separately against the isolated database and passed.
- Type checks passed for types, validation, API, web and database.
- Production Next.js build passed, including `/farming`, `/field-offline`, the proxy and manifest.
- Browser: created a synthetic entity/farm/pond/cycle, recorded expanded water quality, enabled offline capture, reopened the saved snapshot, captured feeding offline and synchronised it once into server history. Network emulation was returned to online.
- `pnpm farming:verify-runtime` passed against the final running API: all eight enterprises accepted their typed records, and identical retries returned the original records without duplicates. The script only writes to an explicit loopback memory demo.
- Responsive browser verification passed at 390 × 844 with no horizontal overflow. The temporary viewport override was reset. [Desktop preview](assets/farming-desktop.png) and [mobile preview](assets/farming-mobile.png) contain synthetic demonstration data only.
- PostgreSQL 18.6, using a cached official image and a dedicated temporary container: migration applied twice; 12 concurrent writes across separate stores preserved; failed transaction rolled back; restart preserved state; snapshot restoration preserved records; dedicated migration command passed. This is isolated local evidence, not production restore acceptance.
- Temporary test containers and networks were removed. No unrelated Docker services or volumes were changed.

See [the runbook](INTEGRATED_FARMING_RUNBOOK.md) for flags, setup, ERP permissions, migration, storage limits and release checks.

## Scope still open

The approved roadmap is broader than this delivered pilot. Full specialist products still need animal identity/pedigree registries, detailed production-stage state machines, linked processing lots, deeper agronomy/hatchery/dairy/poultry analytics, budget/costing reports, complete Hindi UI and domain acceptance. The current implementation supplies manual typed records and shared controls, not all of those specialist engines.

Real ERPNext/India Compliance/Frappe HR installation, company/state tax/payroll setup, commercial inventory synchronization, bank/asset/payroll workflows and statutory test cases are not completed. No real tax filing, payroll, external transaction or provider message was sent. No production database, Keycloak membership, deployment or merge was performed. Independent Gemini/security review remains open.

The user confirmed on 2026-10-09 that the non-production Keycloak realm and ERPNext site are not provisioned. Real provider authentication, posting and statutory acceptance therefore remain unverified. The local preview uses an explicit synthetic memory demo; its records reset when the API restarts.

## Release boundary

Full specialist depth and statutory finance require domain and accountant acceptance, configured providers, persistence/restore verification, security review and the existing independent release audit. Source code, templates and mocks alone do not satisfy those gates.
