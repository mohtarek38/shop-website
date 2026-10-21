import type { INestApplication } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { toNodeHandler } from 'better-auth/node';
import { AUTH_BASE_PATH, type Auth } from './auth.js';
import { AUTH } from './identity.tokens.js';

/**
 * Serves Better Auth's endpoints at /api/auth/*. Must run before app.init() so it is
 * registered ahead of Nest's body parser (Better Auth reads the raw request body).
 */
export function mountAuth(app: INestApplication): void {
  const auth = app.get<Auth>(AUTH);
  const express = (app as NestExpressApplication).getHttpAdapter().getInstance();
  express.all(`${AUTH_BASE_PATH}/{*path}`, toNodeHandler(auth));
}
