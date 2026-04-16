# 🌊 AquaPulse

![Status](https://img.shields.io/badge/status-active%20prototype-0ea5e9)
![Runtime](https://img.shields.io/badge/runtime-mock%20%2F%20in--memory-success)
![Cutover](https://img.shields.io/badge/cutover-incremental%20Postgres%20%2B%20HTTP-8b5cf6)
![Alerts](https://img.shields.io/badge/domain-alerts%20workbench-critical)
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
- **Deployment target:** Self-hosted on Proxmox / Linux VMs

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
- Mortality tracking
- Expenses
- Harvest and sales
- Approval workflows
- Sensor ingestion
- Automation / escalation rules

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
- **Frontend:** Next.js
- **Backend:** NestJS
- **Database:** PostgreSQL
- **Time-series:** TimescaleDB
- **Auth (planned):** Keycloak
- **Realtime (planned):** Socket.IO
- **Dashboards (planned):** Grafana
- **Reports (planned):** Metabase
- **AI:** OpenAI-powered assistant layer using a nano model tier by default

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

### Design rule
> **AI explains, summarizes, drafts, and assists. Humans and rule engines decide.**

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
  ui/         # shared UI layer (future / partial)

docs/
  runbooks/   # local dev and operational runbooks
```

---

## 🌳 Repo Tree

```text
aquapulse/
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  │  ├─ common/
│  │  │  ├─ modules/
│  │  │  │  ├─ alerts/
│  │  │  │  ├─ ponds/
│  │  │  │  ├─ water-quality/
│  │  │  │  ├─ feed/
│  │  │  │  ├─ tasks/
│  │  │  │  └─ ai/
│  │  │  └─ main.ts
│  ├─ web/
│  │  ├─ app/
│  │  │  ├─ (protected)/
│  │  │  └─ api/
│  │  └─ src/
│  │     ├─ clients/
│  │     ├─ contracts/
│  │     ├─ features/
│  │     ├─ mocks/
│  │     ├─ queries/
│  │     ├─ repositories/
│  │     └─ server/
│  └─ worker/
├─ packages/
│  ├─ ai/
│  ├─ database/
│  │  ├─ migrations/
│  │  ├─ scripts/
│  │  └─ src/
│  ├─ types/
│  ├─ ui/
│  └─ validation/
├─ docs/
│  └─ runbooks/
├─ .env.example
├─ package.json
├─ pnpm-workspace.yaml
└─ tsconfig.base.json
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
- docs/runbooks for local alerts cutover

### Current engineering style
- build vertical slices
- preserve stable contracts
- keep runtime safe by default
- cut over one domain at a time
- prefer deterministic testable behavior

---

## 📦 Key Feature Areas

### 1. Pond operations
- pond list
- pond detail
- pond-linked water quality
- pond-linked alerts

### 2. Water quality
- create / update flows
- operator-friendly recording path
- basis for alert generation

### 3. Feed
- feed entry flow
- feed update flow
- anomaly checks as alert input

### 4. Tasks
- task create / update
- operational follow-up surface

### 5. Alerts
- list
- summary
- detail
- lifecycle actions
- triage actions
- bulk actions
- saved views
- review queue
- owner workload
- dashboard summary reuse

---

## 🖼️ Screenshots

Add screenshots here as the UI matures.

Suggested sections:

### Dashboard
```md
![Dashboard](./docs/screenshots/dashboard.png)
```

### Alerts Workbench
```md
![Alerts Workbench](./docs/screenshots/alerts-workbench.png)
```

### Pond Detail
```md
![Pond Detail](./docs/screenshots/pond-detail.png)
```

### Feed Entry
```md
![Feed Entry](./docs/screenshots/feed-entry.png)
```

> Recommended repo path: `docs/screenshots/`

---

## 🌿 Branch Strategy

Use a simple controlled branch flow:

- `main` → stable branch
- `develop` → optional integration branch if you want a staging stream
- `feature/...` → all scoped implementation work
- `fix/...` → focused bug fixes
- `docs/...` → docs-only changes if needed

### Suggested branch naming
- `feat/runtime-health-and-diagnostics-base`
- `feat/openai-nano-alert-explanations`
- `feat/postgres-water-quality-cutover`
- `fix/alerts-runtime-config`
- `docs/local-runbook-update`

### Working rule
- one branch = one bounded outcome
- preserve contracts whenever possible
- merge only after typecheck + tests pass

---

## 🛠️ Local Development

### Default expectation
You can work on AquaPulse without switching the entire app to a live DB/runtime.

### Typical development modes
- **mock / in-memory mode** → safest default
- **alerts-only HTTP opt-in mode** → for local backend exercise
- **Postgres-backed adapter path** → enabled selectively during cutover work

### Repo workflow
- feature branches for focused slices
- verify with typecheck + tests
- keep page-facing contracts stable
- merge only when branch behavior is bounded and verified

---

## ▶️ Typical Commands

```bash
corepack pnpm install
corepack pnpm --filter @aquapulse/api typecheck
corepack pnpm --filter @aquapulse/web typecheck
corepack pnpm exec vitest run
```

### Database-related scripts
```bash
corepack pnpm db:migrations:list
corepack pnpm db:migrations:verify
corepack pnpm db:migrations:show
```

> Exact local cutover setup should follow the repo runbooks and `.env.example`.

---

## ⚙️ Exact Local Setup Steps

### 1. Clone and enter the repo
```bash
git clone <your-repo-url>
cd aquapulse
```

### 2. Install dependencies
```bash
corepack enable
corepack pnpm install
```

### 3. Create env file
Copy `.env.example` and adjust only what you need.

```bash
cp .env.example .env
```

### 4. Run typechecks once
```bash
corepack pnpm --filter @aquapulse/api typecheck
corepack pnpm --filter @aquapulse/web typecheck
```

### 5. Run tests
```bash
corepack pnpm exec vitest run
```

### 6. Start backend
Use your current backend start command from the repo scripts.

Example:
```bash
corepack pnpm --filter @aquapulse/api dev
```

### 7. Start frontend
```bash
corepack pnpm --filter @aquapulse/web dev
```

### 8. Default mode
By default, AquaPulse should stay in:
- mock
- in-memory
- safe local mode

### 9. Alerts-only HTTP opt-in mode
If you want to exercise the alerts workbench against a running backend, configure the relevant env variables in `.env` and use the documented runbook in:

```text
docs/runbooks/alerts-local-http-cutover.md
```

### 10. Verify local health
Check:
- frontend loads
- alerts page shows runtime mode clearly
- backend is reachable if alerts HTTP mode is enabled
- tests still pass after config changes

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

---

## 🧭 Product Roadmap

### Phase 1 — Core ops MVP
- live dashboard
- ponds
- water quality
- feed
- tasks
- alerts
- audit base

### Phase 2 — Operations completeness
- inventory
- medicines / treatments
- expenses
- harvest / sales
- approvals
- advanced reporting

### Phase 3 — Sensor + automation expansion
- device registry
- sensor ingestion
- MQTT/event ingestion
- anomaly correlation
- escalation workflows

### Phase 4 — Production hardening
- worker layer
- background jobs
- stronger backups
- diagnostics
- HA-ready deployment path
- security and release hardening

---

## 🔐 Security Principles

- backend-only secret usage
- no direct AI key exposure in frontend
- auditability for important actions
- role-based access planned through Keycloak
- careful cutover strategy instead of big-bang runtime changes
- no AI direct control over critical records

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
- `aquapulse-auth` (planned)
- `aquapulse-ops` (planned)

### Minimum deployment flow
1. provision Linux host / VM
2. configure DNS and reverse proxy
3. set environment variables
4. run migrations when DB-backed cutovers are needed
5. deploy backend
6. deploy frontend
7. verify health and runtime diagnostics
8. verify alerts workbench path
9. verify tests and smoke checks

### Recommended domains
- `app.example.com` → frontend
- `api.example.com` → API
- `auth.example.com` → auth provider later
- `ops.example.com` → dashboards later

### Before production
- backups tested
- restore path tested
- runtime diagnostics visible
- env validation clean
- cutover mode understood
- AI keys only on backend
- smoke checks documented

---

## 🤝 Development Workflow

The project is being built with a structured feature-branch approach:

1. define bounded scope
2. implement across contracts / backend / frontend / tests
3. keep default runtime safe
4. verify with typecheck + tests
5. cut over incrementally
6. preserve compatibility wherever possible

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
- AI assistant layer planned on top of operational data
- local-dev workflow and deployment path included
