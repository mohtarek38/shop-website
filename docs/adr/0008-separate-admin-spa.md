# ADR-0008: Separate React + Vite staff dashboard

- **Status:** Accepted
- **Date:** 2026-10-19

## Context
Staff (owner, managers, clerks, catalog editors, drivers) need a rich, data-heavy dashboard. It doesn't need SEO, and it shouldn't share deploys, bundles or attack surface with the customer site.

## Decision
A separate **React + Vite** single-page app in `apps/admin`, built to static files and served by Caddy at `admin.<domain>`. It uses TanStack Router/Query/Table, shadcn/ui and i18next (ar/en), and calls the API at `/api/v1/admin/*`. The driver experience is a responsive, permission-limited route set in the same app.

## Consequences
- No extra server process: static files cost almost nothing to host.
- Storefront and dashboard can be deployed and redesigned independently.
- Some UI code duplication with the storefront. A shared `packages/ui` can be extracted later if it becomes significant.

## Alternatives considered
- **Admin inside the Next.js app:** mixes concerns and couples deploys.
- **react-admin / Refine:** faster CRUD at first, but the workflows (confirmation calls, driver view, cash settlement) are custom enough that a framework would get in the way.
