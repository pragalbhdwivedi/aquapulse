# Integrated farming runbook

This is an additive manual farming pilot on `feature/integrated-farming`, based on `develop` commit `56b95f6d40b3099b3851e948434ac29c59854aff`. It does not replace or migrate existing pond records. Review [delivery status](INTEGRATED_FARMING_STATUS.md) before any release decision.

## Local synthetic preview

Install the lockfile dependencies with `pnpm install --frozen-lockfile`. In one PowerShell terminal at the repository root:

```powershell
$env:AQUAPULSE_FARM_DEMO = 'true'
$env:AQUAPULSE_AUTH_MODE = 'disabled'
pnpm dev:api
```

In another terminal, run `pnpm dev:web`, then open `http://localhost:3000/farming`. The API binds only to loopback in demo mode. Demo data is memory-only, uses the explicit `farm-demo-owner` identity, and disappears on API restart. ERP dispatch is disabled. Use synthetic data only. Never enable demo mode on a shared or public deployment.

In Setup, create an Indian legal entity, farm, enterprise production unit and production cycle. Set initial count to zero for crops/products that are not counted. Record stocking separately only when it is additional to the initial count. Choose the farm and cycle in Capture; activity forms change with the enterprise. Add tasks, materials and stock movements through their respective tabs. Treatment review and financial requests need a different authorized reviewer, so a real identity environment needs at least two appropriate users.

## Persistent deployment configuration

Set these in the API's protected deployment environment, not in Git or the browser:

| Variable | Required value or purpose |
| --- | --- |
| `NODE_ENV` | `production` on a production API |
| `AQUAPULSE_FARM_DEMO` | `false` |
| `AQUAPULSE_FARM_STORAGE` | `postgres` |
| `AQUAPULSE_FARM_DATABASE_URL` | Dedicated PostgreSQL connection URL; secret |
| `AQUAPULSE_FARM_DATABASE_TLS` | `verify`; use a trusted server certificate |
| `AQUAPULSE_FARM_ORGANIZATION_ID` | Stable business ID, 1–80 letters/digits/hyphens/underscores |
| `AQUAPULSE_FARM_ORGANIZATION_NAME` | Business display name |
| `AQUAPULSE_FARM_OWNER_SUBJECT` | Exact initial owner's verified Keycloak `sub` |
| `AQUAPULSE_AUTH_MODE` | `keycloak` |
| `AQUAPULSE_KEYCLOAK_ISSUER_URL` | Exact realm issuer |
| `AQUAPULSE_KEYCLOAK_REALM` | Realm name |
| `AQUAPULSE_KEYCLOAK_CLIENT_ID` | API client |
| `AQUAPULSE_KEYCLOAK_AUDIENCE` | Expected API audience, if different from client ID |
| `AQUAPULSE_KEYCLOAK_JWKS_URL` | Optional explicit JWKS endpoint |
| `AQUAPULSE_API_HOST` | Desired network binding; put the API behind trusted ingress |

The new routes deny local-header identities and incomplete Keycloak fallback. Production requests require PostgreSQL and a signed Keycloak token with explicit matching issuer, audience and non-expired expiry. These checks apply to the new farming surface; they do not upgrade historical routes implicitly.

Bootstrap the owner **before the first workspace request**. An existing workspace's memberships are authoritative and are not overwritten from environment variables on restart. Use owner-controlled membership administration to grant/revoke users. Owners have all farms; manager/operator/accountant/viewer grants list explicit farms. Removing the final active owner is rejected. If the first bootstrap was misconfigured, use a reviewed database repair with a backup; changing the environment alone does not repair an existing workspace.

Apply the additive migration to an explicitly approved target only:

```powershell
pnpm --filter @aquapulse/database db:migrations:farming
```

This command reads `AQUAPULSE_FARM_DATABASE_URL` and applies only `0006_integrated_farming.sql`. It does not silently reuse legacy smoke database settings. The historical general migration command still applies its original core schema; use the dedicated farming command for this module. No deployment database was migrated during implementation.

Set the web server's `AQUAPULSE_WEB_LOCAL_API_BACKEND_URL` to the API origin and configure the existing bearer forwarding/session mechanism. Never configure a shared privileged environment bearer for a multi-user production web server. Verify two actual users receive different farm scopes. Serve the browser over HTTPS for offline installation.

## Storage and business authority

One business workspace per deployment is stored as a JSONB aggregate with a PostgreSQL row lock. This provides atomic membership, quantity, submission receipt and ERP queue changes for a small manual pilot. It is not a high-volume SaaS tenancy or normalized analytics design. The workspace has a 32 MiB storage cap, including photo bytes; migrate to normalized records and object storage before larger usage. Photos are limited to 256 KiB each, validated by declared type and signature, and served only after farm authorization. Workspace lists contain photo metadata rather than bytes.

AquaPulse owns biological records, field tasks, observed quantities, source/harvest lots and treatment review. Operational inventory does not produce a general ledger, commercial valuation or ERP stock ledger entry. Record corresponding commercial inventory in ERPNext through its native controls. Crop harvest, milk, eggs, mushrooms and dispatch records are blocked within a recorded treatment withdrawal period or while a prior treatment awaits review. This rule is a record control, not a food-safety or veterinary certification.

Activity edits are represented by a reasoned manager void and a replacement capture. Closed-cycle activity records cannot be voided. Source counts cannot be voided when doing so would make the balance negative. Input receipts/issues/transfers require server validation and sufficient stock. Transfers require access to both farms and equal units; they do not implement a biological conversion or processing yield model.

## Offline operation

While connected, open Device → Enable offline capture. This installs a public application shell and saves a scoped device snapshot. It excludes membership administration, ERP jobs and full audit history. API responses and authenticated HTML are not cached by the farming service worker. The shell has a five-second navigation fallback and API calls have a twelve-second timeout.

The device outbox supports activities, updates to assigned tasks, and photos attached to existing server activities. New farms/cycles, approvals, stock movements and finance operations require a connection. Photos for an activity that itself is still pending must be attached after that activity synchronises. This dependency is not silently guessed.

Reconnect as the capture account and select Synchronise. The server rechecks membership, farm access, schema, cycle state, counts and withdrawal rules. Each capture keeps a UUID; identical retries return the original record. Reusing that UUID for a different payload or actor produces a conflict. Permission failures and conflicts remain in the outbox for review. The client stops on authentication/network failures and never reports a local capture as posted stock or finance.

Device data is not encrypted by this application. Use a trusted locked device, clear cached data on shared devices, and retain pending captures until reconciliation. A membership revoked while completely offline cannot remotely erase the last snapshot; reconnect denial blocks further server access. Switching to a different connected identity invalidates the prior cached snapshot while preserving its identity-scoped outbox for the original account.

## ERPNext, India Compliance and Frappe HR

Use a dedicated test ERP site first. Resolve and pin compatible Frappe, ERPNext, India Compliance and Frappe HR versions together against their official installation guidance; no deployment version matrix or installation was certified here. Configure native Company, fiscal year, accounts, customers/suppliers, items, warehouses, GST registrations, state-specific payroll rules and reporting with the accountant. Register GSP/provider services and credentials only where the chosen statutory workflow requires them.

The owner maps each legal entity to the exact ERPNext Company in Setup. This can be configured later. Invoice jobs snapshot this mapping; changing it invalidates pending approvals/dispatches instead of sending an approved request to a different company. Reject the obsolete request and create a new one. Mapping changes are blocked during an in-flight dispatch.

On **both Sales Invoice and Purchase Invoice**, create a Custom Field with:

| Property | Value |
| --- | --- |
| Fieldname | `custom_aquapulse_event_id` |
| Fieldtype | `Data` |
| Unique | enabled, including the database uniqueness constraint |
| Mandatory | disabled, so native ERP-only documents remain possible |
| Read only | enabled for ordinary users |

Use a restricted ERP service user that can read the relevant company/customer/supplier/item references, read the metadata for these two Custom Fields, read invoices for reconciliation, and create draft Sales/Purchase Invoices in the approved Company scope. Do not give this integration role submit, cancel, delete, payment or payroll execution permissions. Restrict its Company permissions in ERP itself. Test that the installed Frappe version permits the required unique custom field metadata access.

API-side secret configuration:

| Variable | Purpose |
| --- | --- |
| `AQUAPULSE_ERP_ENABLED` | `true` after the test site is accepted |
| `AQUAPULSE_ERP_URL` | HTTPS origin only, no embedded credentials/path/query |
| `AQUAPULSE_ERP_API_KEY` | Restricted service user's key; secret |
| `AQUAPULSE_ERP_API_SECRET` | Restricted service user's secret; secret |
| `AQUAPULSE_ERP_WORKER_ENABLED` | Optional `true` to drain approved queued jobs every 30 seconds |
| `AQUAPULSE_ERP_ALLOW_LOCAL_HTTP` | Development-only loopback test exception; never production |

The optional worker starts only with verified Keycloak configuration and PostgreSQL storage. It checks current creator and approver memberships again at dispatch. Alternatively an authorized owner/accountant can reconcile one approved job manually in Finance. Jobs use a two-minute lease, bounded provider timeouts and provider-enforced unique event IDs. Before creating, and after an ambiguous POST response, the connector looks up the same event. Failed jobs stay visible for human review and explicit retry. Expired processing leases can be recovered after restart.

`draft_created` means a matching ERP draft was confirmed. It never means submitted, paid, GST-filed or payroll-paid. The connector rejects a receipt that is already submitted/cancelled, belongs to another Company, or lacks the expected event ID; reconcile such changes in ERP. GST/e-invoice/e-way-bill, TDS/TCS, reconciliation, assets, statutory returns and payroll continue through native ERPNext/India Compliance/Frappe HR workflows. Their live readiness is an outstanding acceptance gate.

Official references: [Frappe REST API](https://docs.frappe.io/framework/user/en/api/rest), [Custom Fields](https://docs.frappe.io/erpnext/custom-field), [India Compliance installation](https://docs.indiacompliance.app/docs/getting-started/installation), [India Compliance GST setup](https://docs.indiacompliance.app/docs/configuration/gst_setup), [Frappe HR India payroll reports](https://docs.frappe.io/hr/india-payroll/reports).

## Verification and recovery

With the explicit local synthetic API running, `pnpm farming:verify-runtime` creates a synthetic farm with all eight enterprises and checks HTTP capture/replay. It refuses non-loopback targets and non-demo workspaces. Its records remain in the demo until API restart.

```powershell
pnpm typecheck
pnpm --filter @aquapulse/database typecheck
pnpm test:contracts
pnpm db:migrations:verify
pnpm --filter @aquapulse/web exec next build
```

The opt-in PostgreSQL test requires a dedicated disposable database in `AQUAPULSE_FARM_TEST_DATABASE_URL`; it applies migration 0006 and creates/removes only its own synthetic workspace. Never point it at production. Run `pnpm exec vitest run packages/database/src/farming/postgres.integration.test.ts`.

Back up the farming database using the deployment's normal PostgreSQL backup mechanism. Retain the workspace state, revision and submission receipts together. Test restore into an isolated database with the ERP worker disabled and outbound ERP access blocked. Verify memberships, quantities, treatment decisions, photos, tasks and queue receipts before enabling writes. A stale backup can contain jobs whose ERP POST already committed: provider lookup and uniqueness must remain enabled during recovery. Never clear ERP event IDs to make retries succeed.

Rollback application code by disabling the new farming entry point and ERP worker, retaining `farm_workspaces` and its backups. Do not drop the new table or reverse ERP documents automatically. Existing pond tables are unaffected. If a confirmed draft needs cancellation/deletion, follow the ERP owner's native review process.

Before production: real Keycloak authorization/revocation checks; domain-specific sample workflows; PostgreSQL backup/restore; actual ERP timeout/restart reconciliation; accountant-approved Indian statutory and state payroll cases; device tests on target phones; native accessibility validation; independent security/release review, including the existing Gemini audit handoff. Sensors, satellite services, automatic equipment control and other countries remain later work.
