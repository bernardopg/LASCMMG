import { useState, useEffect } from 'react';

/**
 * Hook customizado para fazer debounce de valores
 * Útil para otimizar pesquisas e evitar chamadas desnecessárias de API
 *
 * @param {any} value - Valor a ser debounced
 * @param {number} delay - Delay em milissegundos
 * @returns {any} - Valor debounced
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook para debounce de callbacks
 * Útil para debouncing de funções que são recriadas a cada render
 *
 * @param {Function} callback - Função a ser debounced
 * @param {number} delay - Delay em milissegundos
 * @param {Array} deps - Dependências do useCallback
 * @returns {Function} - Função debounced
 */
export const useDebounceCallback = (callback, delay, deps = []) => {
  const [debounceTimer, setDebounceTimer] = useState(null);

  const debouncedCallback = (...args) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(newTimer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback;
};

export default useDebounce;
