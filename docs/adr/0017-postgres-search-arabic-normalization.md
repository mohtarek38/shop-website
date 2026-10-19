# ADR-0017: Postgres search with Arabic normalization

- **Status:** Accepted
- **Date:** 2026-10-19

## Context
Customers search in Arabic (with spelling variants such as أ/ا, ة/ه, ى/ي), in English, and by model numbers ("rt38"). The catalog is hundreds of products.

## Decision
- A SQL function `normalize_ar()` removes diacritics and tatweel and unifies alef/ta-marbuta/ya forms. The same logic is mirrored in TypeScript in `contracts` so queries and stored text are normalized identically.
- `product.search_text` (normalized ar + en names, brand names, model numbers, SKUs, key specs) is maintained by the catalog service.
- `search_vector` (`tsvector`, `simple` config) + GIN index for word matches; **pg_trgm** on `search_text` for typos and partial model numbers.
- Faceted filters use `jsonb` containment and range queries on `specs`.
- Behind a `SearchProvider` interface in catalog, so Meilisearch could replace it later without touching callers.

## Consequences
- No extra service. Search results stay consistent with the database.
- Ranking is simpler than a dedicated engine; we'll tune it with real product names before launch.

## Alternatives considered
- **Meilisearch / Typesense:** better ranking, but another container and more RAM, and hard to justify for hundreds of products.
- **Postgres `arabic` stemmer config:** stemming can over-match product names; normalization + `simple` + trigram is more predictable. Can be revisited.
