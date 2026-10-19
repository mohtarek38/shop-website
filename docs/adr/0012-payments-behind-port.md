# ADR-0012: COD + manual transfer behind a `PaymentMethod` port

- **Status:** Accepted
- **Date:** 2026-10-19

## Context
At launch we accept only **cash on delivery** and **manual transfers** (InstaPay, Vodafone Cash, bank) verified by staff. Later we expect gateways (Paymob, Fawry, Kashier) and installment providers (valU, Contact, Souhoola).

## Decision
Define a `PaymentMethod` interface in the payments module, for example:

```
key, isAvailable(order), initiate(order) → PaymentInstruction,
handleWebhook?(req), refund?(payment, amount)
```

Implement two adapters now:
- `CashOnDeliveryMethod`: payment `pending`, confirmed when a shipment is delivered with cash collected.
- `ManualTransferMethod`: shows transfer accounts from settings, accepts a receipt upload (private R2), and a clerk with `payments.verify` confirms or rejects.

Adapters are registered under a DI multi-provider token. Checkout lists available methods from the registry.

## Consequences
- Adding a gateway = a new adapter + webhook route + settings keys. Orders and checkout don't change.
- `payment.provider_data` (jsonb) is reserved for gateway-specific data.
- Manual verification is a human step and is fully audit-logged.

## Alternatives considered
- **Hard-coding COD/transfer logic in checkout:** fastest now, but a rewrite later.
