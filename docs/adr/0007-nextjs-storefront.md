# ADR-0007: Next.js storefront

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

Product and category pages must be indexable by search engines and fast on mid-range phones. The storefront must support Arabic (RTL) and English.

## Decision

Use **Next.js (App Router)** with server rendering, deployed in `standalone` mode inside Docker. It fetches data **only through the API** (via `packages/api-client`) and has no direct database access. Styling with Tailwind (logical properties) and shadcn/ui; i18n with next-intl.

## Consequences

- Good SEO and fast first page load. Category and product pages can be cached and revalidated.
- The storefront is replaceable, and the same API serves a future mobile app.
- A Node process on the server uses RAM (budgeted in ADR-0014).
- The built-in Next.js image optimization is **not** used (see ADR-0018).

## Alternatives considered

- **SPA only:** poor SEO for an e-commerce site.
- **Astro / Remix:** viable, but Next.js has the largest ecosystem and hiring pool.
- **Next.js server actions talking to the DB directly:** couples UI and business logic, which goes against ADR-0002.
