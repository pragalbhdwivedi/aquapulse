# Architecture

This folder will hold:

- system context diagrams
- service boundaries
- package ownership
- event and async processing design

Initial scaffold decisions:

- monorepo managed with `pnpm` and `turbo`
- frontend and backend are separate deployable apps
- shared packages hold reusable contracts and tooling
- infra and docs are first-class top-level folders
