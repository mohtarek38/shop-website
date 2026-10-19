# ADR-0016: Background jobs with pg-boss, no Redis

- **Status:** Accepted
- **Date:** 2026-10-19

## Context
We need background work: sending emails, generating image sizes, expiring guest carts, low-stock checks and nightly cleanups. RAM on the server is limited (2 GB).

## Decision
Use **pg-boss**, a job queue stored in PostgreSQL (its own `pgboss` schema). Workers run inside the `api` process. Jobs that must not be lost (emails) are enqueued from event listeners; scheduled jobs use pg-boss cron. Rate limiting uses in-memory storage, which is fine on a single instance.

## Consequences
- No extra service to run, secure or back up. Jobs are included in database backups.
- Jobs can be enqueued in the same transaction as business data.
- Throughput is far lower than Redis-based queues, which is irrelevant at our volume.
- If we ever run multiple API instances, rate limiting will need shared storage (Postgres or Redis).

## Alternatives considered
- **BullMQ + Redis:** an extra container and RAM for no benefit at this scale.
- **Cron in the OS:** jobs live outside the app, with no retries or visibility.
