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

## Implementation notes (2026-10-21)

- **Processed during the upload request**, not in a pg-boss job. Staff upload a few images at a time and resizing takes milliseconds, so a queue only added moving parts. Revisit if uploads ever become bulk (e.g. imports with hundreds of photos).
- **Storage adapters:** `STORAGE_DRIVER=local` (development) writes to `apps/api/.storage/` and the API serves the public bucket at `MEDIA_PUBLIC_URL` (`/api/media/files`), which works same-origin from both frontends. `STORAGE_DRIVER=r2` uses the S3-compatible API; `MEDIA_PUBLIC_URL` is then the CDN domain (e.g. `https://img.<domain>`).
- Uploads are validated by decoding them (not by file extension): JPEG, PNG, WebP or AVIF, at most 10 MB, longest side at least 300px. Photos are rotated from EXIF orientation and the outputs carry no metadata (no GPS).
- Keys are unique per upload (`products/<uuid>/{original,thumb,md,lg}`), so files are cached as immutable.
- Removing an image from a product keeps the file; a cleanup job for unattached media comes later.
