import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.e2e-spec.ts'],
    // e2e tests share one database; run files one at a time.
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
