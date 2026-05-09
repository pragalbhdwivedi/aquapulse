# AquaPulse Runtime Implementation Audit

## Scope
This document audits the actual runtime implementation state of AquaPulse as of 2026-05-09. It does not propose refactors or behavior changes. It records what is implemented, partially implemented, mocked, placeholder-backed, or dangerous to modify.

## Executive Summary
- AquaPulse is a working monorepo with a real NestJS API, Next.js web app, shared types/validation, and an optional Postgres adapter layer.
- The runtime is intentionally dual-path:
  - safe default: mock web + in-memory API
  - opt-in slices: bounded HTTP, bounded Postgres adapters, bounded Keycloak auth, alerts-only websocket live updates, backend-only AI gateway
- Core operational domains are the most mature:
  - alerts
  - ponds
  - water-quality
  - feed
  - tasks
- Several supporting modules exist in code but are not production-complete:
  - attachments
  - batches
  - audit
  - AI persistence tables
  - worker app

## Active Runtime Architecture
- Monorepo: PNPM workspace
- Frontend: Next.js App Router (`apps/web`)
- Backend: NestJS (`apps/api`)
- Shared contracts: `packages/types`, `packages/validation`
- DB package: `packages/database`
- AI package: `packages/ai` is placeholder-only
- Worker app: `apps/worker` exists as a package placeholder only

## Frontend Implementation State

### Implemented
- Protected app-shell pages for:
  - dashboard
  - alerts
  - ponds
  - pond detail
  - tasks
  - feed
  - reports
  - runtime diagnostics
- Shared repository/query layer with runtime-selectable transport
- Mock adapters for all visible product surfaces
- Per-domain HTTP opt-in support for:
  - alerts
  - ponds
  - water-quality
  - feed
  - tasks
- Runtime diagnostics UI
- Current-session bootstrap with safe fallback
- AI review/history/reuse/compare surfaces

### Partially Implemented
- Web runtime mode selection is robust but complex, with overlapping:
  - global mock/http mode
  - per-domain mode overrides
  - proxy vs direct transport
- Local auth forwarding and current-session bridging are bounded rather than platform-wide

### Mocked / Placeholder
- The default web runtime is still mock-backed
- Many demo surfaces are driven by deterministic mock data when HTTP mode is not enabled
- The reports page uses generated mock-safe AI flows by design

### Dangerous To Modify
- `apps/web/src/clients/runtime-config.ts`
- `apps/web/src/clients/index.ts`
- `apps/web/src/queries/index.ts`
- server proxy/auth-forwarding helpers under `apps/web/src/server`

Reason:
- These files encode the bounded rollout model and safe fallback behavior across the whole app.

## Backend Implementation State

### Implemented
- Real NestJS module/controller/application-service structure
- Domain modules:
  - alerts
  - ponds
  - water-quality
  - feed
  - tasks
- Optional Postgres adapter pattern for major domain slices
- Runtime diagnostics service
- Bounded Keycloak/local/disabled auth runtime
- Current-session API
- Alerts live websocket gateway
- Backend AI gateway with deterministic fallback and optional OpenAI provider path

### Partially Implemented
- Placeholder auth guards wrap real bounded auth logic, but naming still signals incremental rollout rather than final platform auth
- Audit interception exists, but the interceptor comment explicitly says the real audit pipeline is not wired yet
- Some non-core modules expose controllers and repos but are not backed by complete schema/migration coverage

### Placeholder / Incomplete
- `apps/worker` has no runtime implementation
- `packages/ai/src/index.ts` exports only `AiPackagePlaceholder`
- `PostgresAuditRepository` returns placeholder rows rather than real queries
- `PostgresAiRepository` is placeholder-backed rather than real table-backed persistence

## Module Status Matrix

| Module | Status | Notes |
|---|---|---|
| Alerts | Implemented, bounded-prod-like | Most mature runtime slice; real reads/writes, auth slices, websocket support |
| Ponds | Implemented | Real app/API path with bounded protected reads and writes |
| Water-quality | Implemented | Real app/API path with detail + recent read protection |
| Feed | Implemented | Real app/API path with detail + recent history protection |
| Tasks | Implemented | Real app/API path with detail + create/update protection |
| AI explanation | Implemented | Backend-first, structured, fallback-safe |
| AI operator assistance | Implemented | Summary, handover, dashboard, incident rewrite/draft, approval note |
| AI history/reuse/compare | Implemented | Review/read-only surface is present |
| Auth foundation | Implemented, bounded | Disabled/local/keycloak modes with JWKS verification |
| Alerts live updates | Implemented, bounded | Alerts-only websocket seam |
| Attachments | Partial | API/repo shape exists, but no schema coverage in current migration |
| Batches | Partial | API/repo shape exists, but no schema coverage in current migration |
| Audit | Partial to placeholder | API surface exists; persistence path is placeholder |
| AI persistence tables | Partial to placeholder | Port exists, in-memory works, postgres path is placeholder |
| Worker | Placeholder | Package only |
| `packages/ai` | Placeholder | No real shared AI runtime library yet |

## Production-Safe Areas
- Alerts bounded HTTP + Postgres + auth + websocket path is the closest thing to production-ready
- Current-session/runtime diagnostics are mature enough for controlled rollout and supportability
- Backend AI gateway is safe from an operational-control standpoint because it is advisory-only and fallback-safe

## High-Risk / Unsafe Areas
- Changing runtime mode selection logic across web and API
- Changing current-session semantics without updating runtime diagnostics and UI guards
- Expanding auth from bounded slices into generic RBAC without a fresh contract pass
- Assuming attachments/batches/audit/AI tables exist in Postgres because repositories reference them

## Documentation vs Runtime Mismatch
- Root `README.md` is aspirational and outdated relative to the actual monorepo, stack, and bounded rollout architecture
- Runtime docs are much more accurate than the root README

## Bottom Line
AquaPulse runtime maturity is real, but uneven. The core operator product is implemented. The platform is not a thin mock. At the same time, it is not a uniformly production-hardened system: it is an intentionally bounded rollout with safe defaults, selective cutovers, and several supporting modules that are still placeholder-backed.
