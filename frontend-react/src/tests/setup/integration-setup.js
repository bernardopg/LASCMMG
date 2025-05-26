import '@testing-library/jest-dom';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { server } from '../mocks/server';

// Estabelece mocks da API antes de todos os testes
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reseta qualquer handler específico do request que foi adicionado em tempo de execução
afterEach(() => {
  server.resetHandlers();
});

// Limpa após todos os testes
afterAll(() => {
  server.close();
});

// Mock do localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock do sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock de window.alert e window.confirm
// eslint-disable-next-line no-undef
global.alert = vi.fn();
// eslint-disable-next-line no-undef
global.confirm = vi.fn();

// Mock de window.dispatchEvent
// eslint-disable-next-line no-undef
global.dispatchEvent = vi.fn();

// Mock do ResizeObserver
// eslint-disable-next-line no-undef
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock do IntersectionObserver
// eslint-disable-next-line no-undef
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
