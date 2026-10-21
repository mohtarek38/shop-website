import { defineConfig } from 'tsup';

export default defineConfig((options) => ({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  // Only clean for one-off builds: in watch mode, wiping dist makes apps that depend on
  // this package briefly lose its files and types (and crash their own watchers).
  clean: !options.watch,
  sourcemap: true,
}));
