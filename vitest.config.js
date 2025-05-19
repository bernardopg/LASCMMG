import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node', // Changed to 'node' for backend testing environment
    globals: true, // Para ter acesso a describe, test, expect, etc. globalmente
    // Opcional: incluir arquivos de setup, se necessário no futuro
    // setupFiles: ['./tests/setupGlobal.js'],
  },
});
