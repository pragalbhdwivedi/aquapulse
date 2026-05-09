# Audit Mutation Risk Matrix

| Surface | Current behavior | Current caller evidence | Metadata reliability | Actor identity reliability | Audit integrity risk | Production necessity | Safest future model |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `POST /api/audit` | Operator-protected public route creates synthetic audit event | No product caller found | Low | Low | High | No clear evidence | Restrict or disable in active Keycloak mode; keep route for contract stability if needed |
| `PATCH /api/audit/:id` | Operator-protected public route mutates synthetic audit event | No product caller found | Low | Low | Very high | No clear evidence | Restrict or disable in active Keycloak mode; do not treat as operator workflow |
| Interceptor-generated audit writes | Automatic runtime write for non-audit routes | Real runtime path | High | High | Low relative to public mutation | Yes | Keep as primary write model |
| Runtime recorder persistence | Persists event plus metadata when Postgres audit repository is active | Real runtime path | High | High | Low relative to public mutation | Yes | Keep as primary durable write model |
| In-memory audit repository `create/update` | Placeholder mutation behavior | Test/local placeholder only | Low | Low | Medium | Development only | Accept for local-safe/testing if route remains broad there |
| Postgres repository `saveEventWithMetadata` | Durable event + metadata write | Runtime recorder path | High | High | Low | Yes | Preferred persistence seam |
| Postgres repository `create/update` | Writes event through `saveEvent()` without guaranteed metadata | Public route only | Low | Low | High | No clear evidence | Avoid exposing to normal operators in active auth |

## Key Risk Takeaways

- The public mutation routes are the weakest integrity seam in the audit stack.
- The runtime recorder path is the strongest integrity seam in the audit stack.
- The actor-scoped read model makes metadata-less public mutation even less appropriate as a normal operator feature.
