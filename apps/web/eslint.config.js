import rtl from '@shop/config/eslint/rtl';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  rtl,
  prettier,
  globalIgnores(['.next/**', 'out/**', 'next-env.d.ts', 'public/**']),
]);
