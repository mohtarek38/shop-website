import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@shop/contracts';
import { fromNodeHeaders } from 'better-auth/node';
import type { Request } from 'express';
import type { Auth } from './auth.js';
import { IS_PUBLIC, REQUIRED_PERMISSIONS } from './decorators.js';
import { IdentityRepository } from './identity.repository.js';
import { AUTH } from './identity.tokens.js';

/**
 * Global guard: resolves the session for every request, rejects anonymous access to
 * non-public routes, and enforces `@RequirePermission()` for staff routes.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH) private readonly auth: Auth,
    private readonly reflector: Reflector,
    private readonly identity: IdentityRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC, targets) ?? false;
    const required =
      this.reflector.getAllAndOverride<Permission[]>(REQUIRED_PERMISSIONS, targets) ?? [];

    const request = context.switchToHttp().getRequest<Request>();
    const session = await this.auth.api.getSession({ headers: fromNodeHeaders(request.headers) });
    if (session) request.auth = session;

    if (!session) {
      if (isPublic && required.length === 0) return true;
      throw new UnauthorizedException('Sign in to continue');
    }

    const access = await this.identity.findUserAccess(session.user.id);
    if (!access || access.disabledAt) throw new UnauthorizedException('Account is disabled');

    if (required.length > 0) {
      const allowed =
        access.type === 'staff' && required.every((p) => access.permissions.includes(p));
      if (!allowed) throw new ForbiddenException('You do not have permission to do this');
    }

    return true;
  }
}
