import path from 'node:path';
import type { NextConfig } from 'next';

/** Where the Next.js server reaches the API (Docker network in production). */
const apiUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

/**
 * next-intl reads its request config through the `next-intl/config` alias. We set the alias
 * directly instead of using `next-intl/plugin`, which eagerly loads the native @swc/core
 * package for an optional message-extraction feature we don't use.
 */
const I18N_REQUEST_CONFIG = './src/i18n/request.ts';

// The placeholder-brand guard runs as a separate build step (see package.json "build").
export default function config(): NextConfig {
  return {
    output: 'standalone',
    // Monorepo root, so standalone output includes workspace packages.
    outputFileTracingRoot: path.resolve(process.cwd(), '../..'),
    transpilePackages: ['@shop/ui'],
    poweredByHeader: false,
    reactStrictMode: true,
    // Images are pre-sized at upload and served from R2 (ADR-0018).
    images: { unoptimized: true },
    // In production Caddy routes /api to the API before Next sees it (ADR-0015);
    // this rewrite gives the same same-origin setup in development.
    async rewrites() {
      return [{ source: '/api/:path*', destination: `${apiUrl}/api/:path*` }];
    },
    turbopack: {
      resolveAlias: { 'next-intl/config': I18N_REQUEST_CONFIG },
      rules: {
        '*.css': { loaders: ['@tailwindcss/turbopack'], as: '*.css' },
      },
    },
    // Only used with `next build --webpack`; Turbopack is the default.
    webpack(webpackConfig: { resolve: { alias: Record<string, string> } }) {
      webpackConfig.resolve.alias['next-intl/config'] = path.resolve(I18N_REQUEST_CONFIG);
      return webpackConfig;
    },
  };
}
