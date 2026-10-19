# ADR-0003: Monorepo with pnpm + Turborepo

- **Status:** Accepted
- **Date:** 2026-10-19

## Context
Three applications (api, web, admin) share types, validation schemas and configuration. Keeping them in separate repos would mean publishing shared packages and keeping their versions in sync.

## Decision
A single Git repository with **pnpm workspaces** (`apps/*`, `packages/*`) and **Turborepo** to run build, lint, test and dev tasks with caching and dependency ordering.

## Consequences
- A change to an API contract and both consumers lands in one PR, so it's type-checked across the whole system.
- One CI pipeline. Turborepo skips unchanged work.
- Every developer works with the whole repo (fine at this size).

## Alternatives considered
- **Polyrepo:** version-syncing overhead for shared packages.
- **Nx:** more powerful, but heavier and more opinionated than we need.
