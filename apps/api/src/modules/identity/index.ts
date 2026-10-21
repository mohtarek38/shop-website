// Public API of the identity module (ADR-0002). Other modules import only from here.
export { CurrentAuth, Public, RequirePermission } from './decorators.js';
export { IdentityModule } from './identity.module.js';
export { mountAuth } from './mount-auth.js';
export type { AuthContext } from './request-auth.js';
