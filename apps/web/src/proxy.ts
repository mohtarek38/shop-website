import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/** Redirects / to /ar (or the visitor's saved language) and keeps the locale prefix. */
export default createMiddleware(routing);

export const config = {
  // Everything except the API, Next internals and files with an extension.
  matcher: ['/((?!api|_next|_vercel|brand|.*\\..*).*)'],
};
