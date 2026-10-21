# ADR-0006: PostgreSQL + Prisma

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

The data is relational (orders, stock, payments need transactions and constraints) but also has flexible parts (category-specific specs, bilingual text). We need one database that can also handle search and background jobs.

## Decision

- **PostgreSQL 18**: relational core, `jsonb` for specs and `LocalizedText`, full-text search + `pg_trgm`, row locking for stock, and pg-boss jobs.
- **Prisma** as ORM and migration tool. Raw SQL (`$queryRaw` / SQL migrations) is allowed for search, triggers, partial indexes and extensions.
- UUIDv7 primary keys; integer money; conventions in [DATABASE.md](../DATABASE.md).

## Consequences

- One database to run, back up and reason about.
- Prisma gives typed queries and simple migrations. Advanced SQL lives in clearly marked raw queries inside repositories.
- Repositories hide Prisma from services, so changing ORM later (e.g. to Drizzle) stays local to repositories.

## Alternatives considered

### Other databases

- **MySQL 8 / MariaDB:** fully supported by Prisma and Better Auth, and equal in performance at our scale. Rejected because features this design relies on are missing or need workarounds:
  - no GIN indexes on JSON (each filterable spec would need its own generated column + index)
  - no trigram similarity, which is needed for typo-tolerant Arabic search and partial model numbers (ADR-0017)
  - **pg-boss doesn't support MySQL**, so jobs would need Redis + BullMQ: another service and more RAM (ADR-0016)
  - no partial indexes (e.g. "only one default stock location")
  - schema changes aren't transactional, so a failed migration can leave the schema half-applied
  - no `INSERT … RETURNING` (MariaDB has it), `timestamptz`, `citext` or `inet`
- **MongoDB (Mongoose):** orders, payments and stock need multi-document transactions, row locking (to prevent overselling), foreign keys and joins for reports. MongoDB transactions require a replica set even on one server, there are no enforced references, and typo-tolerant search needs paid Atlas Search. The flexible-data use cases (category specs, `{ar, en}` text) are already covered by Postgres `jsonb`.
- **SQLite:** zero setup, but writes can't run concurrently (customers + staff + jobs on one file), and it has no pg-boss support.
- **SQL Server / Oracle:** licensing costs; not compatible with a zero budget.
- **Distributed SQL (CockroachDB, PlanetScale…):** built for scale far beyond our needs.

### A second database alongside Postgres (polyglot persistence)

Considered for the audit log, content and analytics, and **deferred**. A second database would add RAM use on a 2 GB server, double the backups and operations work, and create consistency problems: there's no transaction spanning both databases, so an order and its audit entry could drift apart. Because each module's tables are accessed only through its own repository (ADR-0002), any single module can move to another store later without affecting the rest.

**Revisit when:** a module's data clearly fits neither tables nor `jsonb`, **or** one module's volume/load measurably degrades the shared database.

### ORM

- **Drizzle:** a good, closer-to-SQL option; Prisma was chosen for its simpler migrations and wider documentation.
- **Mongoose:** MongoDB-only (see above).
