#!/usr/bin/env node
/**
 * Fails production builds while the brand still has placeholder values (ADR-0021).
 * Apps run this as the first step of `build`. Set ALLOW_BRAND_PLACEHOLDERS=true to bypass
 * (CI, staging and local builds before the brand is final).
 */
import { assertNoPlaceholders } from '../dist/index.js';

try {
  assertNoPlaceholders();
} catch (error) {
  console.error(`\n✖ ${error.message}\n`);
  process.exit(1);
}
