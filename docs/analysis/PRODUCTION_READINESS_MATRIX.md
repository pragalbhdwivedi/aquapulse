# Production Readiness Matrix

## Scale
- `5/5` = production-safe for bounded rollout
- `3/5` = usable but needs hardening
- `1/5` = placeholder or demo-only

| Area | Score | Notes |
|---|---:|---|
| Alerts runtime | 4.5/5 | Strongest module; real reads/writes/auth/live updates |
| Ponds runtime | 4/5 | Good bounded maturity |
| Water-quality runtime | 4/5 | Good bounded maturity |
| Feed runtime | 4/5 | Good bounded maturity |
| Tasks runtime | 4/5 | Good bounded maturity |
| Current-session + runtime diagnostics | 4.5/5 | Strong visibility and bounded auth semantics |
| Keycloak verification path | 4/5 | Real JWKS/token validation exists |
| Full RBAC platform | 2/5 | Bounded slice auth only, not full RBAC |
| Alerts websocket flow | 3.5/5 | Real but narrow and alerts-only |
| AI advisory generation | 4/5 | Real gateway, validated, safe fallback |
| AI persistence | 2/5 | Ports/history exist, Postgres backing incomplete |
| Audit persistence | 1.5/5 | Surface exists, pipeline not fully real |
| Attachments | 2/5 | Surface and repo shape exist, schema missing |
| Batches | 2/5 | Surface and repo shape exist, schema missing |
| Database foundation | 3.5/5 | Core schema exists, but incomplete versus full module list |
| Deployment readiness | 2/5 | Local-safe scripts are good; production deployment layer is incomplete |
| Worker/background jobs | 1/5 | Placeholder only |
| Docs/runbooks | 4/5 | Strong runbook layer; root README still drifts |

## Production-Ready For Bounded Internal Rollout
- dashboard
- alerts workbench
- ponds
- water-quality
- feed
- tasks
- reports/AI surfaces
- runtime diagnostics

## Not Yet Production-Ready As Full Platform
- worker/background processing
- full audit trail persistence
- full AI table-backed persistence
- attachments/batches persistence hardening
- generalized deployment topology
- full RBAC platform

## Summary
AquaPulse is production-capable for a bounded internal/operator rollout on its core flows. It is not yet a fully production-hardened platform across every module and platform seam.
