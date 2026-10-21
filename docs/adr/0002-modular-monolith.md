# ADR-0002: Modular monolith

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

We want decoupled, scalable code, but the business is small (hundreds of products, a single seller, one server, zero budget). Microservices would add network calls, distributed transactions, multiple deployments and operational cost that we can't justify.

## Decision

Build the backend as **one deployable NestJS application** split into **domain modules** (catalog, orders, payments, delivery…). Boundaries are enforced by convention and lint rules:

1. A module is imported only through its `index.ts` (public API).
2. A module's tables are accessed only by that module's repository.
3. Cross-module side effects use domain events (ADR-0020).
4. External services are reached through ports/adapters.

Boundaries are enforced with ESLint import restrictions (e.g. `eslint-plugin-boundaries`).

## Consequences

- One deploy, one database, plain in-process calls and real ACID transactions.
- A module can later be extracted into its own service if ever needed, because its interface and data are already isolated.
- Requires discipline. The lint rules and code review are what keep the boundaries.
- `reports` is an explicit, read-only exception that may query across modules.

## Alternatives considered

- **Microservices:** too much operational cost for this scale.
- **Unstructured monolith:** fastest at first, but becomes hard to change, which goes against the main goal.
