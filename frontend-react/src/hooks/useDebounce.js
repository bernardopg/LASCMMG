import { useState, useEffect, useRef, useCallback } from 'react';

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
 * @returns {Function} - Função debounced
 */
export const useDebounceCallback = (callback, delay) => {
  const timerRef = useRef(null);
  const callbackRef = useRef(callback);

  // Update callbackRef if callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    },
    [delay] // Only delay needs to be in the dependency array for the outer useCallback
  );

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

export default useDebounce;
// Note: The default export is useDebounce, but useDebounceCallback is also exported.
// This is fine, but if only one is primarily used, consider if a default export is needed
// or if named exports for both are preferred. For now, keeping as is.
