import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
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
global.alert = vi.fn();
global.confirm = vi.fn();

// Mock de window.dispatchEvent
global.dispatchEvent = vi.fn();

// Mock do ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock do IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));
