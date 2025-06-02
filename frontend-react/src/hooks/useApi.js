import { useState, useCallback, useRef } from 'react';
import { useErrorHandler } from './useErrorHandler';
import { useMessage } from '../context/MessageContext';

/**
 * Hook customizado para operações de API
 * Fornece estado de loading, cache e controle de cancelamento
 */
export const useApi = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { handleApiError } = useErrorHandler(); // Removed showSuccess from here
  const { showMessage, MESSAGE_TYPES } = useMessage(); // Added MESSAGE_TYPES
  const cancelTokenRef = useRef(null);

  // Cache para requisições
  const cacheRef = useRef(new Map());

  // Função genérica para executar operações de API
  const execute = useCallback(
    async (apiFunction, options = {}) => {
      const {
        showSuccessMessage = false,
        successMessage = 'Operação realizada com sucesso',
        useCache = false,
        cacheKey = null,
        silent = false,
      } = options;

      // Verificar cache se habilitado
      if (useCache && cacheKey && cacheRef.current.has(cacheKey)) {
        const cachedData = cacheRef.current.get(cacheKey);
        // Verificar se o cache ainda é válido (5 minutos)
        if (Date.now() - cachedData.timestamp < 5 * 60 * 1000) {
          return cachedData.data;
        } else {
          cacheRef.current.delete(cacheKey);
        }
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await apiFunction();

        // Armazenar no cache se habilitado
        if (useCache && cacheKey) {
          cacheRef.current.set(cacheKey, {
            data: result,
            timestamp: Date.now(),
          });
        }

        if (showSuccessMessage && !silent) {
          // Use showMessage directly for success
          showMessage({ content: successMessage, type: MESSAGE_TYPES.SUCCESS });
        }

        return result;
      } catch (err) {
        const errorResult = handleApiError(err, 'Erro na operação', { silent });
        setError(errorResult.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [handleApiError, showMessage, MESSAGE_TYPES] // Updated dependencies
  );

  // Limpar cache
  const clearCache = useCallback((key = null) => {
    if (key) {
      cacheRef.current.delete(key);
    } else {
      cacheRef.current.clear();
    }
  }, []);

  // Cancelar requisição em andamento
  const cancel = useCallback(() => {
    if (cancelTokenRef.current) {
      cancelTokenRef.current.cancel('Operação cancelada pelo usuário');
    }
  }, []);

  return {
    isLoading,
    error,
    execute,
    clearCache,
    cancel,
  };
};

export default useApi;
