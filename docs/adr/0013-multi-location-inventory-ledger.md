# ADR-0013: Multi-location inventory with a stock ledger

- **Status:** Accepted
- **Date:** 2026-10-19

## Context
We start with one stock location but may have several. Stock errors (overselling, lost units) are costly for expensive appliances, and we need to know *why* stock changed.

## Decision
- `stock_location` table from day one. One location `MAIN` is seeded as default.
- `stock_level` per (variant, location) with `on_hand` and `reserved`. Available = `on_hand − reserved`.
- **Every** change writes a `stock_movement` row (append-only ledger) in the same transaction. Adjustments require a reason.
- Concurrency: `SELECT … FOR UPDATE` on the affected `stock_level` rows.
- Reservation policy: on placement, reserve at the default location, or else the first location that can fulfil the whole order. Otherwise flag `needs_attention`. Clerks can change the fulfilment location at confirmation.
- The storefront shows availability summed across active locations.

## Consequences
- Adding a location later is just data.
- Full history of every unit, which makes discrepancies traceable.
- Slightly more logic than a single `quantity` column. It lives in one module and is unit-tested.

## Alternatives considered
- **Single `stock` column on the variant:** simplest, but no history and no way to add locations without a migration.
