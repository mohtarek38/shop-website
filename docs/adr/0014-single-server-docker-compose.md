# ADR-0014: Single EC2 server, Docker Compose, Cloudflare

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

The budget is zero apart from the domain. Available: AWS free credits (6 months) and Cloudflare R2. Traffic is expected to be modest.

## Decision

- One **EC2 t3.small** (2 GB RAM + 2 GB swap) running **Docker Compose**: `caddy`, `web`, `api` (with pg-boss workers) and `postgres` (data on a separate EBS volume).
- Container memory limits (initial): postgres 512 MB, api 384 MB, web 384 MB, caddy 64 MB.
- Images built in GitHub Actions, pushed to GHCR, pulled on the server.
- **Cloudflare** for DNS, CDN, SSL and the registrar; **R2** for images (public) and backups (private).
- Backups: nightly `pg_dump` → R2 (30 days), weekly EBS snapshots, quarterly restore drills.
- **Exit plan:** before month 5, move to Oracle Cloud Always Free or Hetzner (restore backup → `compose up` → switch DNS).

## Consequences

- Near-zero cost; the whole system is defined in Git.
- Single point of failure: acceptable at this stage, mitigated by off-site backups and a tested restore.
- We manage the OS (patches, firewall) ourselves; see PLAN §11.4.
- Moving to managed services later (RDS, ECS) doesn't change application code.

## Alternatives considered

- **Vercel + Railway + Neon:** easy, but free tiers are limiting and costs grow per service.
- **Kubernetes:** far more than this scale needs.
