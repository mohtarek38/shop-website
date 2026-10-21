# ADR-0018: Images processed at upload, served from R2

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

Product photos are large. Resizing on every request (e.g. Next.js image optimization) costs CPU and RAM on our small server.

## Decision

- On upload, the media module uses **sharp** (in a pg-boss job) to generate WebP sizes (`thumb` 200px, `md` 600px, `lg` 1200px) and stores them in the public R2 bucket. The original is kept.
- Images are served from R2 through Cloudflare at `img.<domain>`, cached at the edge.
- Next.js uses a custom image loader that picks the right pre-generated size; built-in optimization is disabled.
- Private files (transfer receipts) go to the private bucket and are served only via short-lived signed URLs.
- All storage access goes through the `StorageProvider` port.

## Consequences

- Zero image CPU cost per page view; R2 has free egress.
- Changing sizes later requires a re-processing job (simple, since originals are kept).

## Alternatives considered

- **Next.js on-the-fly optimization:** CPU/RAM heavy on a 2 GB server.
- **Cloudflare Images:** paid.
