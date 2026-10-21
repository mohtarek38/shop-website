import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const apiUrl = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    strictPort: true,
    // Same-origin /api like production, where Caddy routes admin.<domain>/api (ADR-0015).
    proxy: { '/api': apiUrl },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
