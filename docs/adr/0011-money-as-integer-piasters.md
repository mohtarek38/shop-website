# ADR-0011: Money as integer piasters, VAT-inclusive prices

- **Status:** Accepted
- **Date:** 2026-10-19

## Context
Floating-point money causes rounding errors. Egyptian retail prices are shown VAT-inclusive (14%), and invoices must show the VAT portion.

## Decision
- All amounts are stored and computed as **integers in piasters** (EGP × 100). Currency is EGP only. A `currency` field is not added until it's needed.
- Prices entered by staff are **VAT-inclusive**. VAT is extracted for invoices: `vat = round(total × rate / (10000 + rate))` with the rate in basis points (1400).
- The VAT rate comes from settings and is **snapshotted on each order** (`vat_rate_bp`, `vat_amount`).
- All price math lives in the `pricing` module as pure, unit-tested functions. Rounding is half-up, applied once per line.
- Formatting to `12,500 ج.م` happens only at the UI edge.

## Consequences
- No rounding drift. Totals always add up.
- Developers must never use `number / 100` arithmetic outside `pricing`. Helpers in `contracts` handle conversion.

## Alternatives considered
- **`decimal` columns:** correct, but awkward in JavaScript (needs a decimal library everywhere).
