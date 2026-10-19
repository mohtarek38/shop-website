# ADR-0005: NestJS for the API

- **Status:** Accepted
- **Date:** 2026-10-19

## Context
The backend needs a clear structure for many modules, dependency injection (to swap adapters), guards for permissions, and OpenAPI docs, in TypeScript.

## Decision
Use **NestJS** (Express adapter) as the API framework. Each domain module is a Nest module. Adapters are provided via DI tokens (e.g. `PAYMENT_METHODS`, `STORAGE_PROVIDER`).

## Consequences
- Built-in modules, DI, guards, interceptors and Swagger match our architecture.
- Swapping an adapter is a provider change, so business code doesn't change.
- More boilerplate (decorators, modules) than a minimal framework.
- The Express adapter gives the best compatibility with Better Auth's Node handler.

## Alternatives considered
- **Fastify / Express with a hand-rolled structure:** lighter, but we'd have to build and enforce the structure ourselves.
- **Django/DRF (Python):** excellent, but a second language next to the TypeScript frontends.
