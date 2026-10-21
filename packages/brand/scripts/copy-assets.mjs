#!/usr/bin/env node
/**
 * Copies brand assets (logos, favicons) into an app's public folder so they're served at
 * /brand/<file>. Apps run this before dev and build: `node <path>/copy-assets.mjs public/brand`.
 */
import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const target = process.argv[2];
if (!target) {
  console.error('Usage: copy-assets.mjs <target-dir>');
  process.exit(1);
}

const source = resolve(dirname(fileURLToPath(import.meta.url)), '../assets');
const destination = resolve(process.cwd(), target);

rmSync(destination, { recursive: true, force: true });
mkdirSync(destination, { recursive: true });
cpSync(source, destination, {
  recursive: true,
  filter: (path) => !path.endsWith('README.md'),
});
