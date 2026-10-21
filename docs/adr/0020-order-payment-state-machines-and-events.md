# ADR-0020: Separate order/payment state machines + domain events

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

Orders move through confirmation calls, payment verification, delivery attempts, cancellations and returns. Mixing payment states into the order status (e.g. "awaiting payment") leads to an explosion of combinations. Many modules need to react to order changes without being coupled to the orders module.

## Decision

- **Two state machines:**
  - `order.status`: `placed → confirmed → preparing → out_for_delivery → delivered`, plus `cancelled`, `delivery_failed`, `returned`
  - `order.payment_status`: `unpaid`, `awaiting_verification`, `paid`, `rejected`, `refunded`
- Guard example: `confirmed → preparing` only if `payment_method = cod` or `payment_status = paid`.
- Transitions are declared in one table-driven `order-state-machine.ts` (from, to, required permission, guard). All changes go through it and write `order_status_history`.
- **Domain events** (catalogue in [DATABASE.md §18](../DATABASE.md)) are published **after the transaction commits** via `@nestjs/event-emitter`. Listeners that must not lose work enqueue pg-boss jobs.
- Optimistic locking (`version`) on orders prevents two clerks overwriting each other's changes.

## Consequences

- Each state is clear and testable. Invalid transitions are impossible by construction.
- New reactions (e.g. SMS on shipment) are new listeners; the orders module doesn't change.
- In-process events are lost if the process crashes between commit and dispatch. Acceptable for now; critical work is made durable through pg-boss jobs. A transactional outbox can be added later if needed.

## Alternatives considered

- **Single combined status:** too many combinations and confusing.
- **State machine library (XState):** more power than this needs; a small transition table is clearer.
