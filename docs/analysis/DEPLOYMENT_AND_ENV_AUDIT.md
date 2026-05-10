# Deployment And Environment Audit

## Runtime Defaults
- Web default: mock
- API default: in-memory
- Auth default: disabled
- AI default: fallback
- Alerts live updates default: disabled

These defaults are intentional and safe for local development.

## Environment Strategy
- Heavy use of `AQUAPULSE_*` and `NEXT_PUBLIC_AQUAPULSE_*`
- Environment variables support:
  - global runtime mode
  - per-domain mode overrides
  - local backend bridge
  - auth/keycloak
  - websocket live updates
  - verifier flows
  - DB smoke stacks

## Deployment Artifacts Found
- `infra/local/alerts-smoke.compose.yaml`
- many local verifier scripts under `scripts/`
- database migration/seed/smoke scripts under `packages/database/scripts`

## Missing / Limited Deployment Artifacts
- No complete app-wide docker-compose for web + api + postgres + keycloak
- No Kubernetes manifests
- No Terraform/Bicep/Pulumi
- No CI/CD workflow files were observed in the audited file list
- No full production deployment handoff scripts

## Local Runtime Scripts

### Present
- verifier scripts for:
  - alerts
  - auth
  - alerts live updates
  - ponds
  - feed
  - tasks
  - water-quality
  - pond-linked cross-domain flow
- DB migrate/list/verify/seed helpers

### Meaning
- Local verification discipline is strong
- Production deployment discipline is much less visible

## Environment Risks
- Runtime/env surface is powerful but large
- There are many overlapping env controls across:
  - web global mode
  - scoped domain modes
  - direct/proxy transport
  - auth forwarding
  - websocket auth
- Misconfiguration risk is moderate to high without docs

## Production Readiness Gaps
- No complete deployment topology
- No explicit secret-management pattern
- No observable reverse-proxy or TLS deployment guidance
- No full DB migration chain beyond the initial relational foundation

## Summary
Environment control is mature for bounded local rollout and verification. Deployment maturity is still local-first and incomplete for a production handoff.
