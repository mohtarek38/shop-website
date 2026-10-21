# Project Plan — Home & Electric Appliances Online Shop

> Status: **Approved for planning** · Last updated: 2026-10-21
> Related: [DATABASE.md](DATABASE.md) · [BRAND.md](BRAND.md) · [WIREFRAMES.md](WIREFRAMES.md) · [Architecture Decision Records](adr/README.md)

---

## 1. Overview

An online shop selling home and electric appliances in **Egypt**, operated by a **single seller** (us).

- **Customers** browse in Arabic or English, order with **cash on delivery** or a **manual transfer** (InstaPay / Vodafone Cash / bank), and receive orders through **our own delivery team** or a courier (no courier integration yet).
- **Staff** (owner, managers, clerks, catalog editors, drivers) run the business from a **dashboard**.
- **Budget:** zero, except for the domain. Hosting uses existing AWS credits (6 months) and Cloudflare R2.

### Goals

1. Simple, decoupled and professional code that is easy to change later.
2. Arabic-first (RTL) and fully bilingual.
3. Support the real operational workflow: confirmation calls, transfer verification, driver deliveries and cash collection.
4. Room to grow (payment gateways, installments, courier APIs, more locations) by **adding** adapters or modules, not rewriting.

### Non-goals (for now)

- Online card payments, installments, SMS, courier API integrations
- Installation, old-appliance removal and warranty services
- Marketplace / multiple vendors
- Native mobile apps (the storefront is mobile-first and responsive)

---

## 2. Guiding principles

| Principle                          | In practice                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Modular monolith**               | One deployable API, split internally into independent modules. Each module exposes only its `index.ts`.                    |
| **Ports & adapters**               | Every external service sits behind an interface: `StorageProvider`, `PaymentMethod`, `Notifier`, `CourierProvider`.        |
| **Domain events for side effects** | Modules don't call each other to cause side effects. `OrderPlaced` → inventory reserves stock, notifications sends emails. |
| **Shared contracts**               | Zod schemas in `packages/contracts` are the single source of truth for API shapes, validation and form types.              |
| **Boring technology**              | Proven, well-documented tools. No hype tools and no infrastructure we don't need.                                          |
| **Decisions are written down**     | Every significant choice gets an ADR in `docs/adr/`.                                                                       |

---

## 3. Technology stack

### 3.1 Languages & runtime

- **TypeScript 6.0** everywhere (pinned: typescript-eslint doesn't support the native TypeScript 7 yet; revisit when it does)
- **Node.js 24 LTS**
- **PostgreSQL 18**

### 3.2 Repository & tooling

| Tool                        | Purpose                            |
| --------------------------- | ---------------------------------- |
| GitHub                      | Repo, pull requests, issues, CI/CD |
| pnpm workspaces + Turborepo | Monorepo, cached tasks             |
| ESLint + Prettier           | Lint and format                    |
| Husky + lint-staged         | Pre-commit checks                  |
| Conventional Commits        | Commit message format              |

### 3.3 Backend — `apps/api`

| Library                                                              | Purpose                                                                                                     |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| NestJS 12 (ESM)                                                      | Framework (modules, dependency injection)                                                                   |
| Prisma                                                               | ORM + migrations                                                                                            |
| Better Auth (+ Prisma adapter, `nestjs-better-auth` or manual mount) | Authentication: sessions, email/password, phone+password (username plugin), Google, admin plugin, 2FA later |
| pg-boss                                                              | Background jobs stored in Postgres                                                                          |
| @nestjs/event-emitter                                                | In-process domain events                                                                                    |
| Own Zod pipe + `@ZodBody`/`@ZodQuery` (ADR-0022)                     | Request validation and OpenAPI docs from shared schemas                                                     |
| @nestjs/swagger                                                      | OpenAPI docs at `/api/docs`                                                                                 |
| @nestjs/throttler                                                    | Rate limiting on non-auth endpoints                                                                         |
| helmet                                                               | Security headers                                                                                            |
| nestjs-pino                                                          | Structured logging                                                                                          |
| @aws-sdk/client-s3                                                   | Cloudflare R2 client                                                                                        |
| sharp                                                                | Image resizing at upload time                                                                               |
| exceljs                                                              | CSV/Excel product import/export                                                                             |
| date-fns + date-fns-tz                                               | Store UTC, display `Africa/Cairo`                                                                           |
| Sentry SDK                                                           | Error tracking                                                                                              |

### 3.4 Storefront — `apps/web`

| Library                                 | Purpose                                    |
| --------------------------------------- | ------------------------------------------ |
| Next.js (App Router, standalone output) | Server-rendered pages for SEO and speed    |
| Tailwind CSS (logical properties)       | Styling that works for RTL and LTR         |
| shadcn/ui (Radix) + Lucide icons        | Accessible components we own               |
| next-intl                               | `/ar` and `/en` routing + translations     |
| TanStack Query                          | Client-side data (cart)                    |
| React Hook Form + Zod                   | Forms                                      |
| next/font — IBM Plex Sans Arabic        | Self-hosted font covering Arabic and Latin |
| `sitemap.ts` + JSON-LD                  | SEO                                        |
| Cloudflare Web Analytics                | Cookie-free analytics                      |

### 3.5 Staff dashboard — `apps/admin`

| Library                         | Purpose                          |
| ------------------------------- | -------------------------------- |
| React + Vite                    | Single-page app, static build    |
| TanStack Router / Query / Table | Routing, data, tables            |
| shadcn/ui + Tailwind            | UI (same look as the storefront) |
| React Hook Form + Zod           | Forms                            |
| i18next (react-i18next)         | Arabic/English switch            |
| Recharts                        | Dashboard charts                 |

### 3.6 Testing

| Tool           | Purpose                             |
| -------------- | ----------------------------------- |
| Vitest         | Unit tests (all apps)               |
| Supertest      | API endpoint tests                  |
| Testcontainers | Real Postgres for integration tests |
| Playwright     | End-to-end tests of critical flows  |

### 3.7 Infrastructure

| Item                                                   | Purpose                                                   | Cost               |
| ------------------------------------------------------ | --------------------------------------------------------- | ------------------ |
| AWS EC2 t3.small (2 GB) + separate EBS volume for data | Single production server                                  | Credits (6 months) |
| Ubuntu 24.04 LTS + Docker Compose                      | Runs caddy, web, api, postgres                            | Free               |
| Caddy                                                  | Reverse proxy, automatic HTTPS, serves admin static files | Free               |
| GitHub Actions + GHCR                                  | CI/CD, container images                                   | Free               |
| Cloudflare DNS / CDN / SSL                             | Edge                                                      | Free               |
| Cloudflare R2                                          | `images` (public) and `backups` (private) buckets         | Free (10 GB)       |
| Cloudflare Registrar                                   | Domain                                                    | ~$10/year          |
| Resend or Brevo                                        | Transactional email                                       | Free tier          |
| Sentry                                                 | Error tracking                                            | Free tier          |
| UptimeRobot / Better Stack                             | Uptime alerts                                             | Free tier          |

### 3.8 Deliberately not used

Microservices, Kubernetes, Redis, Meilisearch/Elasticsearch, GraphQL, MinIO, Puppeteer/PDF libraries, Vercel/managed databases, SMS. See the ADRs for the reasoning.

---

## 4. Repository layout

```
shop-website/
├── apps/
│   ├── api/                 # NestJS modular monolith
│   │   └── src/
│   │       ├── modules/     # one folder per domain module
│   │       ├── shared/      # cross-cutting: config, db, logger, errors, events
│   │       └── main.ts
│   ├── web/                 # Next.js storefront
│   └── admin/               # React + Vite dashboard
├── packages/
│   ├── contracts/           # Zod schemas + types (API DTOs, enums, permissions)
│   ├── api-client/          # Typed fetch client built on contracts
│   ├── brand/               # Name, logo slots, colour tokens, Tailwind preset (ADR-0021)
│   └── config/              # tsconfig / eslint / prettier presets
├── infra/
│   ├── docker-compose.dev.yml
│   ├── docker-compose.prod.yml
│   ├── Caddyfile
│   └── scripts/             # backup, restore, deploy
├── docs/
│   ├── PLAN.md
│   ├── DATABASE.md
│   └── adr/
└── .github/workflows/
```

### 4.1 Module layout (API)

```
modules/orders/
├── orders.module.ts
├── orders.controller.ts         # storefront endpoints (thin)
├── orders.admin.controller.ts   # dashboard endpoints (thin, permission-guarded)
├── orders.service.ts            # business logic
├── orders.repository.ts         # the ONLY place that queries order tables
├── order-state-machine.ts       # allowed transitions
├── orders.events.ts             # events this module publishes
├── listeners/                   # reactions to other modules' events
└── index.ts                     # public API: service interface, event types
```

**Rules**

1. Import other modules only through their `index.ts`.
2. Only a module's repository touches that module's tables. Other modules call its service or listen to its events.
3. Controllers contain no business logic.
4. External SDKs are imported only inside adapters.

---

## 5. Domain modules

| Module            | Owns                                                             | Notes                                                                                                      |
| ----------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **identity**      | Better Auth tables, roles, permissions                           | The only module that imports Better Auth. Exports `AuthGuard`, `@RequirePermission()`, `getCurrentUser()`. |
| **customers**     | Customers, addresses, block list                                 | A customer is identified by phone; guests are matched by phone.                                            |
| **catalog**       | Categories, category attributes, brands, products, variants      | Per-category spec templates drive filters and comparison.                                                  |
| **media**         | Uploaded files and image sizes                                   | `StorageProvider` → R2                                                                                     |
| **inventory**     | Stock locations, stock levels, stock movements                   | Multi-location, ledger-based                                                                               |
| **pricing**       | Price calculation, sale windows, VAT                             | Pure functions, heavily unit-tested                                                                        |
| **promotions**    | Coupons                                                          | Phase 5                                                                                                    |
| **cart**          | Carts, cart items                                                | Guest cart via cookie, merged on login                                                                     |
| **checkout**      | Turning a cart into an order                                     | Orchestrates pricing, delivery fee and payment method                                                      |
| **orders**        | Orders, items, status history, internal notes                    | Order state machine                                                                                        |
| **payments**      | Payments, transfer receipts, verification                        | `PaymentMethod` port: COD, manual transfer                                                                 |
| **delivery**      | Governorates, areas, zones, drivers, shipments, cash settlements | `CourierProvider` port (manual for now)                                                                    |
| **content**       | Banners, static pages, FAQ                                       |                                                                                                            |
| **reviews**       | Product reviews, wishlist                                        | Phase 5                                                                                                    |
| **notifications** | Email (staff + customers)                                        | `Notifier` port                                                                                            |
| **audit**         | Append-only audit log                                            | Listens to events from all modules                                                                         |
| **reports**       | Read-only aggregates for the dashboard                           | Read-only queries across modules (the documented exception)                                                |
| **settings**      | Store settings key/value                                         | Store info, transfer accounts, WhatsApp number, VAT rate                                                   |

---

## 6. Users, authentication & permissions

### 6.1 Authentication (Better Auth)

- **Staff:** email + password. 2FA available later for Owner/Manager.
- **Customers:** **phone number + password** (username plugin, no SMS) or **Google**. SMS one-time codes may be added later.
- **Accounts are optional.** Guest checkout needs only name + phone + address.
- Sessions are stored in the database (revocable) and use a first-party cookie (API is served same-origin via Caddy, see ADR-0015).
- ⚠️ Better Auth requires an email on every user. Phone-only customers get a synthetic, non-deliverable address (`<e164>@phone.invalid`). **To be validated in a Phase 1 spike.**

### 6.2 Authorization (our own RBAC)

Permissions are defined in code (`packages/contracts/permissions.ts`) and seeded. Roles are **data**, editable by the Owner from the dashboard.

| Permission                                                         | Owner | Manager | Clerk | Catalog editor | Driver |
| ------------------------------------------------------------------ | :---: | :-----: | :---: | :------------: | :----: |
| `catalog.read`                                                     |   ✓   |    ✓    |   ✓   |       ✓        |        |
| `catalog.write` / `catalog.publish`                                |   ✓   |    ✓    |       |       ✓        |        |
| `inventory.read`                                                   |   ✓   |    ✓    |   ✓   |       ✓        |        |
| `inventory.adjust` / `inventory.transfer`                          |   ✓   |    ✓    |       |                |        |
| `orders.read` / `orders.update_status` / `orders.edit`             |   ✓   |    ✓    |   ✓   |                |        |
| `orders.cancel`                                                    |   ✓   |    ✓    |   ✓   |                |        |
| `payments.verify`                                                  |   ✓   |    ✓    |   ✓   |                |        |
| `delivery.assign`                                                  |   ✓   |    ✓    |   ✓   |                |        |
| `delivery.manage_zones` / `delivery.settle_cash`                   |   ✓   |    ✓    |       |                |        |
| `delivery.own` (own deliveries only)                               |       |         |       |                |   ✓    |
| `customers.read`                                                   |   ✓   |    ✓    |   ✓   |                |        |
| `customers.block`                                                  |   ✓   |    ✓    |       |                |        |
| `promotions.manage` / `content.manage`                             |   ✓   |    ✓    |       |                |        |
| `reports.read`                                                     |   ✓   |    ✓    |       |                |        |
| `settings.manage` / `users.manage` / `roles.manage` / `audit.read` |   ✓   |         |       |                |        |

The Owner role is a system role: it can't be deleted and always has every permission.

---

## 7. Core business flows

### 7.1 Order and payment (two separate state machines)

**Order status**

```
placed ──► confirmed ──► preparing ──► out_for_delivery ──► delivered
  │            │             │                │
  └────────────┴─────────────┴──► cancelled   └──► delivery_failed ──► (re-assign) out_for_delivery
                                                                   └──► returned
```

**Payment status**

```
COD:              unpaid ───────────────────────────► paid (cash collected on delivery)
Manual transfer:  unpaid ──► awaiting_verification ──► paid
                                     └──► rejected ──► awaiting_verification (re-upload)
Any:              paid ──► refunded
```

**Rules**

- `placed → confirmed` requires a clerk confirmation call (with a note).
- `confirmed → preparing` requires `paymentMethod = cod` **or** `paymentStatus = paid`.
- Every transition is recorded in `order_status_history` and the audit log, with the acting user.
- The status history is shown on the customer's tracking page. Internal notes are never shown to customers.

### 7.2 Stock

- **On placement:** reserve stock at the default location if it has enough; otherwise at the first location that does. If no single location can cover the whole order, the order is still accepted and flagged for the clerk.
- **On confirmation:** the clerk may change the fulfilment location (release + re-reserve).
- **On `out_for_delivery`:** reserved stock is turned into a deduction (`onHand` and `reserved` both decrease).
- **On cancel:** the reservation is released.
- **On return:** stock is added back (or written off) with a reason.
- Every change writes a `stock_movement` row. Stock levels are never edited without a ledger entry.
- The storefront shows availability summed across all active locations.

### 7.3 Delivery

- An address has governorate → area. Each area belongs to exactly one **delivery zone**.
- Delivery fee = zone base fee + large-item fee (if any item is a large item). Free above the zone threshold, if one is set.
- A clerk assigns a shipment to a **driver** (own team) or a **courier** (name + tracking number typed in manually).
- The driver's mobile view shows today's shipments, the address, a map link and a call button, with actions **Delivered (cash collected)** and **Failed (reason)**.
- **Cash settlement:** cash a driver has collected but not yet handed over adds to their balance. A manager records the settlement and links the shipments it covers.

### 7.4 Manual transfer

1. The customer chooses "Transfer". The order confirmation page shows the account details from settings.
2. The customer uploads a receipt screenshot (stored privately in R2), or support contacts them on WhatsApp.
3. A clerk verifies it and clicks **Mark as paid**, or **Reject** with a reason. Both are audit-logged.

### 7.5 Notifications

- **Customer:** email (if given) on placed, confirmed and shipped. WhatsApp click-to-chat buttons for support.
- **Staff:** dashboard badge counts (polling) + optional email for new orders.
- **Public tracking page:** `/track` takes an order number + phone and shows the status timeline.

---

## 8. Bilingual design (Arabic + English)

| Concern          | Decision                                                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| Default locale   | Arabic (`/ar`); English at `/en`                                                                                     |
| Direction        | `dir="rtl"` / `"ltr"` per locale; Tailwind logical properties only (`ms-`, `me-`, `ps-`, `pe-`)                      |
| URLs             | English slugs in both locales (`/ar/refrigerators/samsung-rt38`), `hreflang` tags                                    |
| DB content       | Translatable fields stored as JSONB `{ "ar": "...", "en": "..." }`. Arabic required, English optional with fallback. |
| UI strings       | next-intl (web), i18next (admin). Message files in `ar.json` / `en.json`.                                            |
| Numbers          | **Western digits** in both locales: `Intl.NumberFormat('ar-EG-u-nu-latn')`                                           |
| Currency display | `12,500 ج.م` (ar) / `EGP 12,500` (en)                                                                                |
| Dates            | `Africa/Cairo`, localized month names                                                                                |
| Search           | Arabic normalization + English brand/model matching (ADR-0017)                                                       |
| Dashboard        | Both languages; each staff member picks theirs (stored on the user)                                                  |

---

## 9. Money & tax

- All amounts are **integers in piasters** (1 EGP = 100 piasters). Never floats.
- Prices are **VAT-inclusive** (14%, configurable in settings). Invoices show the VAT portion extracted from the total.
- Orders **snapshot** names, prices, the address and the delivery fee at purchase time.
- A single `pricing` module computes everything: line totals, discounts, delivery and VAT. Pure functions, fully unit-tested.
- Before launch: confirm **ETA e-receipt** obligations with an accountant. The invoice model is designed to be connected to it later.

---

## 10. API conventions

- REST under `/api/v1`. Storefront endpoints: `/api/v1/...`. Dashboard endpoints: `/api/v1/admin/...` (all permission-guarded).
- Auth endpoints: `/api/auth/*` (Better Auth).
- Errors use **RFC 9457 Problem Details** (`type`, `title`, `status`, `detail`, `errors[]`).
- Pagination: `?page=&pageSize=` with metadata. Cursor pagination only if needed later.
- Request and response bodies are validated with `packages/contracts` schemas.
- OpenAPI docs at `/api/docs` (disabled or protected in production).
- Optimistic locking (`version` column) on orders, so two clerks editing the same order can't overwrite each other.

---

## 11. Environments & deployment

### 11.1 Local

- `docker compose -f infra/docker-compose.dev.yml up`: Postgres + Mailpit
- Apps run with `pnpm dev` (Turborepo runs all three)
- R2 **dev bucket** for images
- Seed script: roles, permissions, governorates/areas, sample categories, products and staff users

### 11.2 Production host layout

```
Cloudflare (DNS, CDN, SSL) ──► EC2 t3.small
                                └─ Docker Compose
                                   ├─ caddy     :80/:443
                                   │    <domain>/api/*        → api
                                   │    <domain>/*            → web
                                   │    admin.<domain>/api/*  → api
                                   │    admin.<domain>/*      → admin static files
                                   ├─ web       (Next.js standalone)
                                   ├─ api       (NestJS + pg-boss workers)
                                   └─ postgres  (data on dedicated EBS volume)
R2: img.<domain> (public images) · backups (private)
```

Before the domain is bought, use an `sslip.io` hostname for staging.

### 11.3 CI/CD (GitHub Actions)

1. On PR: install → lint → type-check → unit + integration tests → build.
2. On merge to `main`: build Docker images → push to GHCR → SSH to the server → `docker compose pull && up -d` → API container runs `prisma migrate deploy` on start.
3. Playwright end-to-end tests run against staging (a separate Compose project on the same server, or locally, until there's budget).

### 11.4 Server hardening

- SSH keys only; SSH allowed only from your IP (security group); ports 80/443 open to the public
- `fail2ban`, `unattended-upgrades`, 2 GB swap file
- Secrets in `/opt/shop/.env` (mode 600) and GitHub Actions secrets

### 11.5 Backups

- Nightly `pg_dump` (compressed) → R2 `backups`, kept 30 days
- Weekly EBS snapshot
- **A restore drill before launch** and every quarter

### 11.6 After the AWS credits end (month 6)

Plan the move by **month 5**: Oracle Cloud Always Free (ARM, $0) or Hetzner (about €4/month). Because everything runs in Docker Compose, moving = restore the backup + `docker compose up` + update DNS.

---

## 12. Quality

- **Unit tests:** pricing, order and payment state machines, stock reservation, permission checks, Arabic normalization.
- **Integration tests:** every API endpoint, against a real Postgres (Testcontainers).
- **End-to-end tests (Playwright):**
  1. Guest browse → cart → checkout (COD) → tracking page.
  2. Clerk confirms → assigns driver → driver delivers → cash settled.
  3. Transfer order → receipt upload → clerk verifies.
- CI must pass before merging. `main` is always deployable.
- Accessibility: keyboard navigation, focus states, alt text (`{ar,en}`), colour contrast.
- Performance budget: product and category pages LCP < 2.5s on mid-range mobile over 4G.

---

## 13. Delivery phases

Each phase ends with a deploy to production (behind basic auth until launch).

### Phase 0 — Decisions & design

- [x] Requirements and stack agreed
- [x] PLAN.md, DATABASE.md, ADRs
- [x] Low-fidelity wireframes for storefront and dashboard ([WIREFRAMES.md](WIREFRAMES.md))
- [x] Brand system with swappable name/logo/colours ([BRAND.md](BRAND.md), ADR-0021)
- [x] Palette chosen: B, Teal home
- [x] Visual mockups of key pages ([design/mockups.html](design/mockups.html))
- [ ] Shop name + logo (can come later: placeholders until then, production build blocks them)

### Phase 1 — Foundation

- [x] Monorepo, tooling, shared config, CI pipeline
- [x] Docker dev environment, env validation, logging, error format
- [x] Prisma schema v1 (identity) + migrations + seed
- [x] **Spike:** Better Auth in NestJS (phone+password, synthetic email): passed, see ADR-0009
- [x] Identity module: staff login, roles/permissions, guards
- [x] Storefront and dashboard shells with ar/en + RTL (staff login, permission-filtered menu)
- [ ] EC2 provisioned, Caddy, first deploy, backups running
- **Exit:** a staff member can log in to the deployed dashboard in Arabic and English.

### Phase 2 — Catalog

- [x] Categories + attribute templates, brands, products, variants (API + sample catalog)
- [x] Dashboard catalog screens: products (list, filters, editor with spec form and variants), categories (spec-template builder), brands
- [ ] Media upload → sharp → R2
- [ ] Stock locations + stock levels + adjustments (ledger)
- [ ] CSV/Excel import/export
- [ ] Storefront: home, category listing with filters, product page, comparison, search
- [ ] SEO: sitemap, JSON-LD, hreflang, metadata
- **Exit:** the real catalog is loaded and browsable on the deployed site.

### Phase 3 — Checkout & orders (MVP)

- [ ] Governorates/areas/zones seed + zone management
- [ ] Cart (guest + user), checkout, address form
- [ ] Customer accounts (phone+password, Google)
- [ ] COD + manual transfer (receipt upload, verification)
- [ ] Order + payment state machines, stock reservation
- [ ] Dashboard order queue, order detail, notes, timeline
- [ ] Printable invoice + delivery slip
- [ ] Email notifications, `/track` page
- **Exit:** a real order can be placed, confirmed and fulfilled end to end.

### Phase 4 — Delivery operations

- [ ] Drivers, assignment board, driver mobile view
- [ ] Failed deliveries, re-assignment, returns
- [ ] Cash settlement
- [ ] Courier shipments (manual tracking number)
- [ ] Low-stock alerts, stock transfers between locations
- [ ] Audit log viewer, customer block list
- **Exit:** daily operations run entirely in the system.

### Phase 5 — Growth

- [ ] Coupons, scheduled sales
- [ ] Reviews (moderated), wishlist
- [ ] Customer order history
- [ ] Reports: sales, top products, orders by zone, driver performance
- [ ] Content: banners, static pages, FAQ
- [ ] WhatsApp buttons, SEO polish

### Phase 6 — Launch

- [ ] Legal pages: terms, privacy (Law 151/2020), returns (Law 181/2018)
- [ ] ETA e-receipt check with an accountant
- [ ] Security pass, dependency audit, rate-limit review
- [ ] Backup restore drill
- [ ] Sentry + uptime alerts live
- [ ] Domain purchased, DNS, R2 custom domain
- [ ] Remove basic auth → **launch**

### Later (each is an adapter or module added without rewrites)

Paymob/Fawry/Kashier · valU/Contact/Souhoola installments · SMS one-time codes · courier APIs (Bosta, Mylerz) · ETA e-receipt integration · installation/warranty services · 2FA for staff · WhatsApp Business API.

---

## 14. Risks

| Risk                              | Impact                     | Mitigation                                                                        |
| --------------------------------- | -------------------------- | --------------------------------------------------------------------------------- |
| Single server, database in Docker | Downtime / data loss       | Nightly off-site backups to R2, EBS snapshots, quarterly restore drills           |
| AWS credits expire                | Unexpected bill            | Calendar reminder for month 5; Compose makes migration easy                       |
| 2 GB RAM limit                    | Slowness / crashes         | Swap, memory limits per container, images resized at upload, no Redis/Meilisearch |
| Fake COD orders                   | Wasted deliveries          | Confirmation call step, customer block list, phone validation, rate limiting      |
| Better Auth requires email        | Phone-only signup friction | Synthetic `.invalid` email; validated in Phase 1 spike                            |
| Arabic search quality             | Poor discovery             | Normalization + trigram matching, tested with real product names                  |
| Scope creep                       | Delayed launch             | Phases with exit criteria; anything new goes to "Later" first                     |

---

## 15. Glossary

| Term       | Meaning                                                                           |
| ---------- | --------------------------------------------------------------------------------- |
| COD        | Cash on delivery                                                                  |
| Piaster    | 1/100 EGP; the unit all amounts are stored in                                     |
| Zone       | A group of areas sharing delivery fees                                            |
| Large item | A product flagged as bulky (fridge, washer), which adds the zone's large-item fee |
| Settlement | A driver handing collected cash to the business                                   |
| ADR        | Architecture Decision Record                                                      |
