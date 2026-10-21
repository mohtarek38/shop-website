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
pnpm dev                                     # API on http://localhost:4000/api (docs at /api/docs)
```

Checks (same as CI):

```bash
pnpm turbo run build lint typecheck test
pnpm --filter @shop/api test:e2e             # uses a disposable shop_test database
```

## Repository layout

| Path                 | What                                           |
| -------------------- | ---------------------------------------------- |
| `apps/api`           | NestJS API (modular monolith)                  |
| `packages/contracts` | Shared Zod schemas and types                   |
| `packages/brand`     | Shop name, logo slots, colour tokens           |
| `packages/config`    | Shared TypeScript and ESLint presets           |
| `infra/`             | Docker Compose files                           |
| `docs/`              | Plan, database design, brand, wireframes, ADRs |
