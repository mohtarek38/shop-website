import { createParamDecorator, type ExecutionContext, SetMetadata } from '@nestjs/common';
import type { Permission } from '@shop/contracts';
import type { Request } from 'express';
import type { AuthContext } from './request-auth.js';

export const IS_PUBLIC = 'identity:isPublic';
export const REQUIRED_PERMISSIONS = 'identity:requiredPermissions';

/**
 * Routes are private by default. `@Public()` allows anonymous access;
 * the signed-in user (if any) is still available via `@CurrentAuth()`.
 */
export const Public = () => SetMetadata(IS_PUBLIC, true);

/** Staff-only route requiring ALL listed permissions. */
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS, permissions);

/** The current session and user, or `null` on anonymous public routes. */
export const CurrentAuth = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthContext | null =>
    ctx.switchToHttp().getRequest<Request>().auth ?? null,
);
