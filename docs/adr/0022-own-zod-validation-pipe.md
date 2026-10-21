# ADR-0022: Own Zod validation pipe instead of nestjs-zod

- **Status:** Accepted
- **Date:** 2026-10-21

## Context

ADR-0004 planned to validate API requests with the shared Zod schemas through `nestjs-zod`. When Phase 1 started, the current releases were NestJS 12 (now ESM-only) and Zod 4, and `nestjs-zod` only supports NestJS 10–11. Everything else in the stack (Better Auth's Nest integration, nestjs-pino, @nestjs/swagger) already supports NestJS 12.

## Decision

Stay on NestJS 12 and replace `nestjs-zod` with a small in-house module, `apps/api/src/shared/http/zod-validation.ts`:

- `ZodValidationPipe`: `safeParse` with the shared schema; on failure throws `RequestValidationException`, which the Problem Details filter renders as a 400 with per-field `errors[]`.
- `@ZodBody(schema)` / `@ZodQuery(schema)`: parameter decorators that validate **and** document the input in OpenAPI using Zod 4's built-in `z.toJSONSchema(..., { target: 'openapi-3.0' })`.

Response DTOs are documented with `@ApiResponse` where useful; the frontends rely on the shared Zod types, not on generated clients.

## Consequences

- One less dependency, and no wait for a third-party library to support new NestJS majors.
- About 60 lines of code we own, covered by unit and e2e tests.
- If `nestjs-zod` adds NestJS 12 support and we need its extra features (e.g. typed response serialization), switching is local to this file and controller decorators.

## Alternatives considered

- **Downgrade to NestJS 11:** works today, but starts the project one major behind, on the CommonJS line, with a known migration ahead.
- **class-validator DTOs:** duplicates the rules already in `@shop/contracts` (goes against ADR-0004).
