# AquaPulse

Open-source aquaculture operations platform built as a TypeScript monorepo.

## Current Status

This repository currently contains the initial workspace scaffold only:

- `apps/web`: Next.js frontend shell
- `apps/api`: NestJS backend shell
- `apps/worker`: background worker placeholder
- `packages/ui`: shared UI components
- `packages/config`: shared TypeScript, Biome, and Vitest config assets
- `packages/types`: shared TypeScript types
- `packages/validation`: shared Zod schemas and helpers
- `packages/database`: database layer placeholder
- `packages/ai`: AI integration placeholder
- `infra`: Docker, Compose, reverse proxy, and utility script stubs
- `docs`: starter documentation for architecture, deployment, AI, and database

No business modules have been implemented yet.

## Stack

- Package manager: `pnpm`
- Monorepo orchestration: `turbo`
- Frontend: `Next.js`
- Backend: `NestJS`
- Shared language/tooling: `TypeScript`, `Biome`, `Vitest`

## Workspace Layout

```text
aquapulse/
├─ apps/
│  ├─ api/
│  ├─ web/
│  └─ worker/
├─ packages/
│  ├─ ai/
│  ├─ config/
│  ├─ database/
│  ├─ types/
│  ├─ ui/
│  └─ validation/
├─ infra/
│  ├─ compose/
│  ├─ docker/
│  ├─ reverse-proxy/
│  └─ scripts/
├─ docs/
│  ├─ ai/
│  ├─ architecture/
│  ├─ database/
│  └─ deployment/
├─ .env.example
├─ .gitignore
├─ biome.json
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ turbo.json
└─ vitest.workspace.ts
```

## Getting Started

```bash
pnpm install
pnpm dev
```

Useful commands:

```bash
pnpm lint
pnpm format
pnpm test
pnpm typecheck
```

## Branching Recommendation

The next branch should focus on platform foundations rather than domain features:

`feat/database-and-auth-foundation`

That branch should establish:

- database tooling and schema workflow
- environment loading and secrets strategy
- authentication and authorization foundations
- local developer stack wiring in `infra/compose`

## Documentation

- [Architecture](docs/architecture/README.md)
- [Deployment](docs/deployment/README.md)
- [AI](docs/ai/README.md)
- [Database](docs/database/README.md)
