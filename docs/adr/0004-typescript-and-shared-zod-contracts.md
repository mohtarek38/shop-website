# ADR-0004: TypeScript everywhere + shared Zod contracts

- **Status:** Accepted
- **Date:** 2026-10-19

## Context

The frontend and backend must agree on request/response shapes and validation rules (Egyptian phone numbers, address fields, translatable text). Duplicating these causes subtle bugs.

## Decision

- **TypeScript** (strict mode) in every app and package.
- `packages/contracts` contains **Zod** schemas for every API input/output, shared enums (statuses), the permission catalog and the `LocalizedText` type.
- The API validates with these schemas (nestjs-zod). Frontends use them for forms (React Hook Form resolver) and derive types with `z.infer`.
- `packages/api-client` is a thin typed `fetch` wrapper built on the contracts.

## Consequences

- One definition per rule. Changing it shows type errors everywhere it's used.
- Contracts must stay free of server-only code (no Prisma or Node imports) so the browser bundles stay small.

## Alternatives considered

- **OpenAPI codegen only:** works, but validation logic would still be duplicated on the frontend.
- **tRPC:** tight coupling between client and server and less natural for a public REST API; harder to reuse for a future mobile app.
