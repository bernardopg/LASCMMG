import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Changed to 'jsdom' for React component testing
    globals: true, // Para ter acesso a describe, test, expect, etc. globalmente
    setupFiles: ['./vitest.setup.js'], // Setup file for jest-dom matchers
  },
});
