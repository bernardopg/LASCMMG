import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom', // Usa jsdom para simular o ambiente do navegador
    globals: true, // Para ter acesso a describe, test, expect, etc. globalmente
    // Opcional: incluir arquivos de setup, se necessário no futuro
    // setupFiles: ['./tests/setupGlobal.js'],
  },
});
