import type { AuthSession } from './auth.js';

export type AuthContext = AuthSession;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by AuthGuard when the request carries a valid session. */
      auth?: AuthContext;
    }
  }
}
