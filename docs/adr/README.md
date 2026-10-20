# Architecture Decision Records

An ADR captures one significant decision: the context, the decision itself, and its consequences. ADRs are never edited after acceptance except to change their status. To change a decision, write a new ADR that **supersedes** the old one.

Copy [template.md](template.md) for new records. Number them sequentially.

| # | Decision | Status |
|---|---|---|
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-modular-monolith.md) | Modular monolith | Accepted |
| [0003](0003-monorepo-pnpm-turborepo.md) | Monorepo with pnpm + Turborepo | Accepted |
| [0004](0004-typescript-and-shared-zod-contracts.md) | TypeScript everywhere + shared Zod contracts | Accepted |
| [0005](0005-nestjs-for-the-api.md) | NestJS for the API | Accepted |
| [0006](0006-postgresql-and-prisma.md) | PostgreSQL + Prisma | Accepted |
| [0007](0007-nextjs-storefront.md) | Next.js storefront | Accepted |
| [0008](0008-separate-admin-spa.md) | Separate React + Vite staff dashboard | Accepted |
| [0009](0009-better-auth-and-own-rbac.md) | Better Auth for authentication, own RBAC for authorization | Accepted |
| [0010](0010-bilingual-arabic-first.md) | Bilingual, Arabic-first (RTL) | Accepted |
| [0011](0011-money-as-integer-piasters.md) | Money as integer piasters, VAT-inclusive prices | Accepted |
| [0012](0012-payments-behind-port.md) | COD + manual transfer behind a `PaymentMethod` port | Accepted |
| [0013](0013-multi-location-inventory-ledger.md) | Multi-location inventory with a stock ledger | Accepted |
| [0014](0014-single-server-docker-compose.md) | Single EC2 server, Docker Compose, Cloudflare | Accepted |
| [0015](0015-same-origin-api-routing.md) | Same-origin API through Caddy path routing | Accepted |
| [0016](0016-background-jobs-pg-boss.md) | Background jobs with pg-boss, no Redis | Accepted |
| [0017](0017-postgres-search-arabic-normalization.md) | Postgres search with Arabic normalization | Accepted |
| [0018](0018-images-processed-at-upload.md) | Images processed at upload, served from R2 | Accepted |
| [0019](0019-printable-html-invoices.md) | Printable HTML invoices instead of a PDF library | Accepted |
| [0020](0020-order-payment-state-machines-and-events.md) | Separate order/payment state machines + domain events | Accepted |
| [0021](0021-brand-as-configuration.md) | Brand as configuration (`packages/brand`) | Accepted |
