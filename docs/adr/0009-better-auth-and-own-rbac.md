# ADR-0009: Better Auth for authentication, own RBAC for authorization

- **Status:** Accepted
- **Date:** 2026-10-19

## Context
We need staff login (email + password), optional customer accounts (phone + password, Google), revocable sessions, password reset, rate limiting and later 2FA. Building this ourselves is risky. Egyptian customers expect phone-based login, but SMS costs money.

## Decision
- Use **Better Auth** with the Prisma adapter for **authentication** only:
  - email + password (staff, and customers who prefer email)
  - **username plugin with the E.164 phone number as username** for customer phone + password login (no SMS)
  - Google social login for customers
  - admin plugin (ban users, revoke sessions); two-factor plugin later for staff
  - database-backed sessions with a cookie cache
- Better Auth is imported **only inside the `identity` module**. Other modules see `AuthGuard`, `@RequirePermission()` and `getCurrentUser()`.
- **Authorization is our own RBAC:** permissions defined in code, roles stored as data and editable by the Owner (see PLAN §6.2). Better Auth's access-control plugin is not used because its roles are defined in code.
- Mounted at `/api/auth/*` in NestJS (community `nestjs-better-auth` package or a manual mount, excluded from the body parser).
- SMS one-time-code login may be added later via the phone-number plugin.

## Consequences
- Proven auth flows without writing them ourselves. Sessions are revocable instantly, which matters when a clerk leaves.
- Better Auth owns the `user`, `session`, `account` and `verification` tables. We extend `user` via `additionalFields`.
- ⚠️ **Better Auth requires an email on every user.** Phone-only customers get a synthetic, non-deliverable email `<e164>@phone.invalid`. Email-sending code must skip `.invalid` addresses. **To be validated in a Phase 1 spike.**
- Replacing Better Auth later only affects the identity module.

## Alternatives considered
- **Hand-rolled JWT + refresh tokens:** more code, more risk, harder to revoke.
- **Auth0 / Clerk / Cognito:** paid beyond free tiers, external dependency, less control over phone login.
- **Passport.js:** low-level; we'd still build sessions, reset flows and rate limiting.
