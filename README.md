# 🌊 AquaPulse

![Status](https://img.shields.io/badge/status-active%20prototype%20%2F%20internal%20beta-0ea5e9)
![Runtime](https://img.shields.io/badge/runtime-mock%20%2F%20in--memory-success)
![Cutover](https://img.shields.io/badge/cutover-incremental%20Postgres%20%2B%20HTTP-8b5cf6)
![Alerts](https://img.shields.io/badge/domain-alerts%20workbench-critical)
![Docs](https://img.shields.io/badge/docs-source--ready-22c55e)
![AppSec](https://img.shields.io/badge/AppSec-47%20point%20baseline-f97316)
![Stack](https://img.shields.io/badge/stack-Next.js%20%2B%20NestJS%20%2B%20PostgreSQL-111827)
![AI](https://img.shields.io/badge/AI-OpenAI%20nano%20planned-f59e0b)

**AquaPulse** is a modern, self-hosted aquaculture operations platform for **pond culture / aquaculture farm management**.

It is designed to help farm operators, supervisors, admins, owners, and data-entry teams manage:

- 🐟 ponds and batches
- 💧 water quality
- 🍽️ feed entries
- ✅ tasks and approvals
- 🚨 alerts and review workflows
- 📊 dashboards and reports
- 🧾 audit-friendly operational records
- 🤖 AI-assisted summaries, explanations, and bilingual operational help

---

## ✨ Project Status

- **Stage:** Active prototype / internal beta foundation
- **Runtime default:** Mock / in-memory safe mode
- **Cutover strategy:** Gradual, opt-in Postgres and HTTP cutovers
- **Current strongest domain:** Alerts workbench and operator workflow
- **Latest verified backend state:** API dev server starts locally; `/api/health` and `/api/diagnostics/runtime` return `200`
- **Documentation status:** Source-ready docs pack prepared for `docs/`
- **Security status:** RBAC, audit, AI safety, and 47-point AppSec baseline mapped
- **Deployment target:** Self-hosted on Proxmox / Linux VMs
- **Production status:** Not production-ready yet; staging, DB cutover, RBAC enforcement, backups, and Gemini audit remain required

---

## 🧭 Tracker Snapshot

AquaPulse is tracked as a multi-phase project with sessions, branches, dependencies, risks, Codex tasks, Gemini audit gates, and deployment checks.

| Metric | Current Snapshot |
|---|---:|
| Total phases | 6 |
| Total planned sessions | 42 |
| Total feature branches | 39 |
| Average session completion | 24.5% |
| Critical Codex tasks | 10 |
| Open critical risks | 5 |

| Phase | Name | Completion | Current Position |
|---|---|---:|---|
| P0 | Foundation, Planning & Governance | 81.5% | Strong planning base |
| P1 | Core Platform / Prototype MVP | 36.2% | Active MVP build |
| P2 | Full Operations Expansion | 9.1% | Planned |
| P3 | Sensors, IoT & Automation | 0.8% | Future / planning |
| P4 | Support, Documentation & Training | 0% | Future |
| P5 | Production Hardening & Enterprise Readiness | 1.4% | Early planning |

---

## 🎯 Vision

AquaPulse is being built as a **custom operational web application**, not a spreadsheet or low-code system.

The platform aims to provide a **real-time farm command center** for daily aquaculture operations with:

- structured manual entry first
- sensor/API ingestion later
- role-based workflows
- live operational dashboards
- strong alerting and auditability
- AI as an **assistant layer**, not as an autonomous controller

---

## 🧩 What AquaPulse Covers

### Core farm operations
- Pond master data
- Batch lifecycle
- Water-quality recording
- Feed entry and tracking
- Mortality tracking
- Task assignment and follow-up
- Alerts, triage, and review flows
- Audit trail foundations

### Operator workflows
- Alert acknowledge / resolve
- Assignment and review states
- Notes and action history
- Queue filters and presets
- Summary rollups and dashboard reuse
- Bulk alert actions
- Saved alert views

### Planned operations expansion
- Inventory
- Medicines and treatments
- Expenses
- Harvest and sales
- Approval workflows
- Sensor ingestion
- Automation / escalation rules
- Management and finance reporting

---

## 👥 Roles

| Role | Main Scope | Target Stage |
|---|---|---|
| Owner | Full visibility, executive reports, final approvals | MVP |
| Admin | Users, roles, masters, thresholds, settings | MVP |
| Supervisor | Alerts, tasks, approvals, operations review | MVP |
| Pond Manager | Pond entries, assigned tasks, alert response | MVP |
| Data Entry Operator | Forms, uploads, CSV import, drafts | MVP |
| Accountant | Inventory value, expenses, harvest, sales, reports | P2 |
| Warehouse Manager | Receive, issue, and adjust stock | P2 |
| Lab Technician | Water readings and sample records | P2 |
| Worker | Assigned task completion only | P2 / P3 |
| Partner Viewer | Read-only approved reports | P2 |
| Auditor | Read-only audit and compliance view | P4 |
| IoT Device Admin | Device and sensor management | P3 |

---

## 🚨 Alerts Workbench Highlights

AquaPulse already centers around a strong operator-focused alert workflow:

- alert generation from operational data
- acknowledge / resolve lifecycle
- triage and assignment
- review labels and review states
- notes and action history
- review queue with filters and sorting
- owner workload summary
- saved views
- bulk actions
- detail panel / workbench-style flow
- dashboard rollup reuse

This is one of the core operational pillars of the platform.

---

## 🏗️ Architecture

```text
Users
  │
  ▼
Next.js Frontend
  │
  ▼
NestJS API
  │
  ├── Business Logic Modules
  ├── Alert Engine
  ├── Audit / Approval Flow
  ├── AI Gateway
  └── Realtime / Event Layer (planned)
  │
  ├── PostgreSQL / TimescaleDB
  ├── File Storage
  ├── Grafana / Metabase (planned integration path)
  └── Local-first + opt-in runtime cutovers
```

### Core stack
- **Frontend:** Next.js + TypeScript
- **Backend:** NestJS + TypeScript
- **Database:** PostgreSQL
- **Time-series:** TimescaleDB
- **Auth:** Keycloak
- **Realtime:** Socket.IO
- **Dashboards:** Grafana OSS
- **Reports:** Metabase OSS
- **Search:** Meilisearch later
- **AI:** Backend-only OpenAI Responses API using a nano model tier by default
- **Deployment:** Proxmox VMs, Debian 12 preferred

> Older FastAPI / Python / n8n starter references should be treated as historical context unless explicitly approved again.

---

## 🧠 AI Philosophy

AquaPulse AI is meant to **assist**, not control.

### AI is intended for
- alert explanations
- farm summaries
- shift handovers
- text rewrite / cleanup
- bilingual Hindi ↔ English support
- dashboard Q&A
- incident draft generation
- approval note drafting

### AI is **not** allowed to do directly
- close alerts automatically
- approve treatments
- change thresholds
- post inventory or finance records
- modify critical operational data without humans
- delete records
- receive full database dumps

### Design rule
> **AI explains, summarizes, drafts, and assists. Humans and rule engines decide.**

---

## 🔐 AppSec 47-Point Baseline

AquaPulse AppSec is planned as a backend-enforced security and audit baseline. Frontend role hiding is treated as UX only, not authorization.

### A. Governance and planning
- [ ] 1. Security owner defined
- [ ] 2. Threat model created for farm, finance, inventory, AI, and IoT flows
- [ ] 3. Data classification completed
- [ ] 4. Security requirements added to PRD/TRD
- [ ] 5. AppSec checks included in Definition of Done
- [ ] 6. Gemini audit gate required before production

### B. Authentication and session security
- [ ] 7. Keycloak OIDC/JWT login implemented
- [ ] 8. Protected APIs reject missing token with `401`
- [ ] 9. Invalid/expired tokens rejected
- [ ] 10. Session timeout and refresh behavior defined
- [ ] 11. Deactivated users blocked
- [ ] 12. Admin accounts separated from normal operator accounts

### C. Authorization and RBAC
- [ ] 13. Backend permission guards implemented
- [ ] 14. Role-to-permission matrix finalized
- [ ] 15. Wrong-role access returns `403`
- [ ] 16. Sensitive actions require explicit permissions
- [ ] 17. Partner/viewer roles are read-only
- [ ] 18. Field-level permission needs documented for later phases

### D. Input, API, and data validation
- [ ] 19. DTO validation on all write endpoints
- [ ] 20. Shared schemas between frontend/backend where useful
- [ ] 21. Unsafe deletes blocked or converted to void flows
- [ ] 22. Pagination, filtering, and sorting guarded
- [ ] 23. API response envelope standardized
- [ ] 24. Error responses avoid leaking internals

### E. Database, migrations, and auditability
- [ ] 25. PostgreSQL migrations used for schema changes
- [ ] 26. Rollback strategy documented for migrations
- [ ] 27. Sensitive actions written to audit log
- [ ] 28. Threshold changes audited
- [ ] 29. Alert closure/dismissal audited
- [ ] 30. Treatment, inventory, expense, and batch closure changes audited
- [ ] 31. Record deletion/voiding requires audit reason

### F. Secrets, infrastructure, and deployment
- [ ] 32. No secrets committed to repo
- [ ] 33. OpenAI/API keys backend-only
- [ ] 34. Database never exposed publicly
- [ ] 35. CORS restricted by environment
- [ ] 36. TLS through reverse proxy
- [ ] 37. Firewall enabled on every VM
- [ ] 38. Backup and restore test documented
- [ ] 39. Staging environment required before production

### G. File upload and attachment security
- [ ] 40. Upload MIME/type validation
- [ ] 41. Upload size limits enforced
- [ ] 42. Attachments served through controlled backend path
- [ ] 43. Attachment deletion audited

### H. AI safety and realtime controls
- [ ] 44. AI cannot directly write critical records
- [ ] 45. AI receives minimal context only
- [ ] 46. AI output is schema-validated and logged
- [ ] 47. Realtime events emit only after successful database commit

---

## 🧱 Monorepo Structure

```text
apps/
  api/        # NestJS backend
  web/        # Next.js frontend
  worker/     # future background jobs / workers

packages/
  types/      # shared contracts and endpoint shapes
  validation/ # shared schemas
  database/   # DB runtime, schema, migrations, adapters
  ai/         # future AI gateway package
  ui/         # shared UI layer

docs/
  runbooks/   # local dev and operational runbooks
```

---

## 🔄 Runtime Strategy

AquaPulse follows a **safe-by-default runtime model**.

### Default mode
- mock / in-memory
- easy local development
- no required DB cutover to use core flows

### Gradual opt-in cutovers
Selected domains can be moved independently toward:
- real HTTP-backed workbench flows
- real Postgres-backed adapter execution
- local end-to-end verification before global cutover

This approach reduces risk while the app grows module by module.

---

## 🧪 Current Technical Direction

### Already emphasized in the project
- strict contracts between frontend and backend
- shared validation
- module-first backend architecture
- repository/client/runtime seams
- stable alert workbench flow
- gradual Postgres adapter cutovers
- local alerts HTTP bridge
- runtime diagnostics endpoint
- docs/runbooks for local alerts cutover

### Current engineering style
- build vertical slices
- preserve stable contracts
- keep runtime safe by default
- cut over one domain at a time
- prefer deterministic testable behavior
- Codex implements; Gemini audits before production

---

## ▶️ Typical Commands

```bash
corepack pnpm install
corepack pnpm --filter @aquapulse/api typecheck
corepack pnpm --filter @aquapulse/web typecheck
corepack pnpm exec vitest run
```

### Backend local verification
```bash
corepack pnpm --filter @aquapulse/api run dev
curl -i http://localhost:4000/api/health
curl -i http://localhost:4000/api/diagnostics/runtime
```

### Database-related scripts
```bash
corepack pnpm db:migrations:list
corepack pnpm db:migrations:verify
corepack pnpm db:migrations:show
```

---

## 📘 Documentation

Suggested places to look in the repo:

- `docs/runbooks/` → local development and runtime workflows
- `.env.example` → runtime/environment examples
- `packages/types` → shared contracts
- `packages/validation` → shared validation
- `packages/database` → schema, migrations, DB boundary
- `apps/api` → backend modules and routes
- `apps/web` → frontend workbench and dashboards

### Source-ready documentation pack

The source-ready documentation pack is prepared for copy into `docs/`:

```text
docs/
├── README_DOCS_INDEX.md
├── MANIFEST.json
├── product/PRD.md
├── technical/TRD.md
├── design/UI_UX_DESIGN.md
├── flows/APP_FLOW.md
├── database/BACKEND_SCHEMA.md
├── handoff/CODEX_HANDOFF.md
├── security/SECURITY_RBAC_AUDIT.md
├── api/API_CONTRACTS.md
├── realtime/REALTIME_EVENTS.md
├── ai/AI_GOVERNANCE.md
├── testing/ACCEPTANCE_CRITERIA.md
└── deployment/DEPLOYMENT_READINESS.md
```

### Mandatory first analysis docs

Before any new implementation session, Codex should create:

```text
docs/analysis/REPOSITORY_AUDIT.md
docs/analysis/IMPLEMENTATION_STATUS.md
docs/analysis/GAP_ANALYSIS.md
docs/analysis/TECHNICAL_DEBT.md
docs/analysis/DUPLICATE_SYSTEMS.md
docs/analysis/MISSING_CONTRACTS.md
docs/analysis/SAFE_TO_MODIFY.md
docs/analysis/BLOCKERS.md
```

---

## 🌿 Branch Strategy

Use a controlled branch flow:

- `main` → stable branch
- `develop` → optional integration branch if you want a staging stream
- `analysis/...` → repository audit and gap analysis branches
- `feature/...` → all scoped implementation work
- `fix/...` → focused bug fixes
- `docs/...` → docs-only changes if needed
- `infra/...` → deployment and VM/service work

### Suggested branch naming
- `analysis/p0-s0-1-repository-audit`
- `docs/p0-s0-2-source-docs-pack`
- `feature/p1-s1-2-auth-rbac`
- `feature/p1-s1-3-water-quality`
- `feature/p1-s1-5-ai-alert-explanations`
- `fix/alerts-runtime-config`
- `infra/staging-deployment`

### Working rule
- one branch = one bounded outcome
- analyze repository state first
- preserve contracts whenever possible
- merge only after typecheck + tests pass
- production only after Gemini audit passes

---

## 🧭 Product Roadmap

### Phase 0 — Foundation and governance
- requirement discovery
- product scope and module boundaries
- role and permission planning
- technical architecture
- AI governance
- deployment strategy
- database and ERD planning
- UX/UI direction

### Phase 1 — Core ops MVP
- repo and monorepo foundation
- auth / RBAC
- live dashboard
- ponds
- batches
- water quality
- feed
- mortality
- tasks
- alerts
- audit base
- AI v1

### Phase 2 — Operations completeness
- inventory
- medicines / treatments
- expenses
- harvest / sales
- approvals
- advanced reporting
- search

### Phase 3 — Sensor + automation expansion
- device registry
- sensor ingestion
- MQTT/event ingestion
- anomaly correlation
- escalation workflows

### Phase 4 — Support, documentation, and training
- SOPs
- user manuals
- training portal
- operational playbooks
- feedback workflow

### Phase 5 — Production hardening
- worker layer
- background jobs
- stronger backups
- diagnostics
- HA-ready deployment path
- security and release hardening
- DR runbooks

---

## 📡 Planned Integrations

- Keycloak
- TimescaleDB
- Socket.IO
- Grafana
- Metabase
- Meilisearch
- MQTT / sensor ingestion
- OpenAI-backed AI gateway

---

## 🚀 Deployment Section

### Target environment
- self-hosted on Proxmox / Linux VMs
- reverse proxy in front
- API and web split cleanly
- PostgreSQL / TimescaleDB for persistence
- optional auth, dashboards, and ops tools as separate services later

### Suggested service layout
- `aquapulse-web`
- `aquapulse-api`
- `aquapulse-db`
- `aquapulse-auth`
- `aquapulse-ops`
- `aquapulse-edge` if a separate proxy VM is preferred
- `aquapulse-iot` later for MQTT and sensor ingestion

### Before production
- backups tested
- restore path tested
- runtime diagnostics visible
- env validation clean
- cutover mode understood
- AI keys only on backend
- RBAC validated
- audit logs validated
- smoke checks documented
- Gemini audit passed

---

## 🤝 Development Workflow

The project is being built with a structured feature-branch approach:

1. analyze repository state
2. generate gap analysis
3. define bounded scope
4. implement across contracts / backend / frontend / tests
5. keep default runtime safe
6. verify with typecheck + tests
7. cut over incrementally
8. preserve compatibility wherever possible
9. prepare Gemini audit

---

## 📌 Guiding Principle

> **Build operational value first.**
>
> AquaPulse should help a farm team record, monitor, review, explain, and act — reliably, clearly, and with a safe path from prototype to production.

---

## 📄 License

```text
Proprietary - Internal Use Only
```

---

## 🙌 Notes

This README reflects the current AquaPulse direction:
- self-hosted
- open-source friendly stack
- mock-safe default runtime
- incremental Postgres cutover
- strong alerts-first operator workflow
- source-ready documentation pack prepared
- 47-point AppSec baseline mapped
- AI assistant layer planned on top of operational data
- Codex builds and Gemini audits before production
- local-dev workflow and deployment path included
