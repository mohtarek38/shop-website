# ADR-0015: Same-origin API through Caddy path routing

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

The storefront (`<domain>`) and dashboard (`admin.<domain>`) both call the API and rely on session cookies. A separate `api.<domain>` would require CORS and cross-subdomain cookie configuration, and would share sessions between the two sites.

## Decision

Caddy routes `/api/*` on **each host** to the `api` container:

```
<domain>/api/*        → api      <domain>/*        → web
admin.<domain>/api/*  → api      admin.<domain>/*  → admin static files
```

Cookies are host-only (no `Domain` attribute), `HttpOnly`, `Secure`, `SameSite=Lax`. Next.js server-side fetches call the API over the internal Docker network and forward the request's cookies.

## Consequences

- No CORS. Cookies are first-party, and storefront and dashboard sessions are separate.
- The API must trust `X-Forwarded-*` headers from Caddy only (trust proxy configured).
- Dashboard endpoints additionally check that the user is `staff` with the required permission.

## Alternatives considered

- **`api.<domain>` + CORS + shared parent-domain cookies:** more configuration and more attack surface.
