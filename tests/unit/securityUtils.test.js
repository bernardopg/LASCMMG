/* eslint-env browser */
/* global document */
/*
 * Testes para os utilitários de segurança
 *
 * Este arquivo contém testes unitários para validar a proteção contra XSS
 * e outras vulnerabilidades de segurança.
 */

import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import {
  createSafeElement,
  sanitizeHTML,
  setElementTextSafely,
} from '../../frontend/js/utils/securityUtils.js';

describe('Prevenção XSS - sanitizeHTML', () => {
  test('deve remover scripts injetados', () => {
    const input = 'Texto normal <script>alert("XSS")</script>';
    const sanitized = sanitizeHTML(input);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('&lt;script&gt;');
  });

  test('deve escapar tags HTML maliciosas', () => {
    const input = 'Texto <img src="x" onerror="alert(1)">';
    const sanitized = sanitizeHTML(input);
    expect(sanitized).not.toContain('onerror=');
    expect(sanitized).toContain('&lt;img');
  });

  test('deve lidar com ataques baseados em atributos', () => {
    const input = '<a href="javascript:alert(\'XSS\')">Clique aqui</a>';
    const sanitized = sanitizeHTML(input);
    expect(sanitized).not.toContain('javascript:');
    expect(sanitized).toContain('&lt;a href=');
  });

  test('deve lidar com valores nulos ou indefinidos', () => {
    expect(sanitizeHTML(null)).toBe('');
    expect(sanitizeHTML(undefined)).toBe('');
    expect(sanitizeHTML('')).toBe('');
  });

  test('deve converter valores não-string para string', () => {
    // Objetos são convertidos para string
    expect(sanitizeHTML({ a: 1 })).toContain('Object');
    // Números são convertidos para string
    expect(sanitizeHTML(123)).toBe('123');
    // Arrays são convertidos para string
    expect(sanitizeHTML([1, 2, 3])).toBe('1,2,3');
  });

  test('deve preservar texto normal', () => {
    const input = 'Texto normal sem tags HTML';
    const sanitized = sanitizeHTML(input);
    expect(sanitized).toBe(input);
  });
});

// Se o ambiente global tiver o DOM (navegador ou jsdom)
if (typeof document !== 'undefined') {
  describe('Prevenção XSS - DOM API segura', () => {
    let container;

    beforeEach(() => {
      // Criar um container fresco para cada teste
      container = document.createElement('div');
      document.body.appendChild(container);
    });

    afterEach(() => {
      // Limpar após cada teste
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    });

    test('createSafeElement deve criar elementos sem vulnerabilidades XSS', () => {
      const element = createSafeElement(
        'div',
        {
          class: 'teste',
          'data-info': '<script>alert("XSS")</script>',
        },
        'Conteúdo <b>negrito</b>'
      );

      container.appendChild(element);

      // Verificar se o atributo está sanitizado
      expect(element.getAttribute('data-info')).not.toContain('<script>');

      // Verificar se o conteúdo de texto está seguro
      expect(element.innerHTML).not.toContain('<b>');
      expect(element.textContent).toContain('Conteúdo <b>negrito</b>');
    });

    test('setElementTextSafely deve definir texto sem processar HTML', () => {
      const element = document.createElement('div');
      container.appendChild(element);

      setElementTextSafely(
        element,
        'Texto com <script>alert("malicioso")</script>'
      );

      // Verificar se o HTML não foi processado
      expect(element.innerHTML).not.toContain('<script>');
      // O texto completo deve estar preservado como texto
      expect(element.textContent).toContain('<script>');
    });

    test('createSafeElement deve bloquear atributos de evento (on*)', () => {
      const element = createSafeElement(
        'button',
        {
          onclick: 'alert("XSS")',
          onmouseover: 'alert("Hover")',
        },
        'Botão'
      );

      container.appendChild(element);

      // Verificar se os atributos de evento foram bloqueados
      expect(element.hasAttribute('onclick')).toBeFalsy();
      expect(element.hasAttribute('onmouseover')).toBeFalsy();
    });
  });
}
