# Shop Website

Online shop for home and electric appliances in Egypt: Arabic/English storefront, staff dashboard, cash on delivery and manual transfer payments.

> **Status:** Phase 1 (foundation) in progress.

## Documentation

- [Project plan](docs/PLAN.md): scope, stack, architecture, flows, phases
- [Database design](docs/DATABASE.md)
- [Brand system](docs/BRAND.md)
- [Wireframes](docs/WIREFRAMES.md)
- [Architecture Decision Records](docs/adr/README.md)

## Stack (summary)

TypeScript monorepo (pnpm + Turborepo) · NestJS API · Next.js storefront · React + Vite dashboard · PostgreSQL + Prisma · Better Auth · Docker Compose on AWS EC2 · Cloudflare R2

## Local development

Requirements: Node 24, pnpm, Docker Desktop.

```bash
pnpm install
pnpm db:up                                   # Postgres (localhost:5433) + Mailpit (http://localhost:8025)
cp apps/api/.env.example apps/api/.env
pnpm --filter @shop/api db:deploy            # apply migrations
pnpm --filter @shop/api db:seed              # roles, permissions, dev owner account
pnpm dev                                     # all apps
```

| App        | URL                                                                     |
| ---------- | ----------------------------------------------------------------------- |
| Storefront | http://localhost:3000 (redirects to `/ar`)                              |
| Dashboard  | http://localhost:5173 (sign in with the dev owner from `apps/api/.env`) |
| API        | http://localhost:4000/api (OpenAPI docs at `/api/docs`)                 |

Both frontends call the API through `/api` on their own origin, like production. In development, cookies on `localhost` are shared between ports, so the storefront and dashboard share a session; in production they're separate hosts.

Checks (same as CI):

```bash
ALLOW_BRAND_PLACEHOLDERS=true pnpm turbo run build lint typecheck test
pnpm --filter @shop/api test:e2e             # uses a disposable shop_test database
```

`ALLOW_BRAND_PLACEHOLDERS=true` is needed for production builds until the shop name and domain are set in `packages/brand` (ADR-0021).

## Repository layout

| Path                 | What                                           |
| -------------------- | ---------------------------------------------- |
| `apps/api`           | NestJS API (modular monolith)                  |
| `packages/contracts` | Shared Zod schemas and types                   |
| `packages/brand`     | Shop name, logo slots, colour tokens           |
| `packages/config`    | Shared TypeScript and ESLint presets           |
| `infra/`             | Docker Compose files                           |
| `docs/`              | Plan, database design, brand, wireframes, ADRs |
