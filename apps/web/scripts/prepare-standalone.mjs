#!/usr/bin/env node
/**
 * `output: 'standalone'` doesn't copy static assets or public/ next to the server.
 * Copy them so `pnpm start` (and the Docker image) serve CSS, JS and brand files.
 * https://nextjs.org/docs/app/api-reference/config/next-config-js/output
 */
import { cpSync, existsSync } from 'node:fs';

const appDir = '.next/standalone/apps/web';
if (!existsSync(`${appDir}/server.js`)) {
  console.error(`✖ ${appDir}/server.js not found. Run "next build" first.`);
  process.exit(1);
}

cpSync('.next/static', `${appDir}/.next/static`, { recursive: true });
if (existsSync('public')) cpSync('public', `${appDir}/public`, { recursive: true });
