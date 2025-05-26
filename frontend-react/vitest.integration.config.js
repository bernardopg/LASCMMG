/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'integration',
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup/integration-setup.js'],
    include: ['src/tests/integration/**/*.test.{js,jsx}'],
    globals: true,
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/**', 'src/tests/**', '**/*.config.js', '**/dist/**'],
    },
    env: {
      VITE_API_URL: 'http://localhost:3000',
      NODE_ENV: 'test',
    },
  },
  define: {
    global: 'globalThis',
  },
});
