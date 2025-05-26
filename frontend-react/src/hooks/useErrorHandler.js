import { useCallback } from 'react';
import { useMessage } from '../context/MessageContext';

/**
 * Hook customizado para tratamento consistente de erros na aplicação
 * Fornece funções padronizadas para mostrar erros, logs e notificações
 */
export const useErrorHandler = () => {
  const { showMessage } = useMessage();

  /**
   * Trata erros de API de forma consistente
   * @param {Error} error - Objeto de erro
   * @param {string} defaultMessage - Mensagem padrão se não houver mensagem específica
   * @param {Object} options - Opções adicionais
   */
  const handleApiError = useCallback(
    (error, defaultMessage = 'Erro inesperado', options = {}) => {
      const { showNotification = true, logError = true, silent = false } = options;

      // Extrair mensagem de erro
      let errorMessage = defaultMessage;

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Log do erro para debugging
      if (logError) {
        console.error('Error Handler:', {
          message: errorMessage,
          status: error?.response?.status,
          url: error?.config?.url,
          method: error?.config?.method,
          stack: error?.stack,
          response: error?.response?.data,
        });
      }

      // Mostrar notificação se não estiver em modo silencioso
      if (showNotification && !silent && showMessage) {
        showMessage(errorMessage, 'error');
      }

      // Log para serviço de monitoramento
      if (window.analytics && logError) {
        window.analytics.track('API Error', {
          message: errorMessage,
          status: error?.response?.status,
          url: error?.config?.url,
          method: error?.config?.method,
        });
      }

      return {
        message: errorMessage,
        status: error?.response?.status,
        handled: true,
      };
    },
    [showMessage]
  );

  /**
   * Trata erros de validação de formulários
   * @param {Object} validationErrors - Objeto com erros de validação
   * @param {string} generalMessage - Mensagem geral de erro
   */
  const handleValidationError = useCallback(
    (validationErrors, generalMessage = 'Por favor, corrija os erros no formulário') => {
      if (!validationErrors) return;

      // Se for um array de erros
      if (Array.isArray(validationErrors)) {
        const firstError = validationErrors[0];
        showMessage && showMessage(firstError?.message || generalMessage, 'warning');
        return;
      }

      // Se for um objeto com erros por campo
      if (typeof validationErrors === 'object') {
        const errorMessages = Object.values(validationErrors).flat();
        const firstError = errorMessages[0];
        showMessage && showMessage(firstError || generalMessage, 'warning');
        return;
      }

      // Fallback
      showMessage && showMessage(generalMessage, 'warning');
    },
    [showMessage]
  );

  /**
   * Trata erros de autenticação
   * @param {Error} error - Erro de autenticação
   */
  const handleAuthError = useCallback(
    (error) => {
      const status = error?.response?.status;

      let message = 'Erro de autenticação';

      switch (status) {
        case 401:
          message = 'Sessão expirada. Faça login novamente.';
          break;
        case 403:
          message = 'Você não tem permissão para realizar esta ação.';
          break;
        case 429:
          message = 'Muitas tentativas. Tente novamente em alguns minutos.';
          break;
        default:
          message = error?.response?.data?.message || 'Erro de autenticação';
      }

      showMessage && showMessage(message, 'error');

      // Log específico para erros de auth
      console.error('Authentication Error:', {
        status,
        message,
        url: error?.config?.url,
      });

      return { message, status, handled: true };
    },
    [showMessage]
  );

  /**
   * Trata erros de rede
   * @param {Error} error - Erro de rede
   */
  const handleNetworkError = useCallback(
    (error) => {
      let message = 'Erro de conexão';

      if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
        message = 'Tempo limite esgotado. Verifique sua conexão.';
      } else if (error?.message?.includes('Network Error')) {
        message = 'Erro de rede. Verifique sua conexão com a internet.';
      }

      showMessage && showMessage(message, 'error');

      console.error('Network Error:', {
        message,
        code: error?.code,
        originalMessage: error?.message,
      });

      return { message, handled: true };
    },
    [showMessage]
  );

  /**
   * Wrapper para executar operações com tratamento de erro automático
   * @param {Function} operation - Função assíncrona a ser executada
   * @param {Object} errorOptions - Opções para tratamento de erro
   */
  const withErrorHandling = useCallback(
    async (operation, errorOptions = {}) => {
      try {
        return await operation();
      } catch (error) {
        // Determinar tipo de erro e tratar adequadamente
        if (error?.response?.status === 401 || error?.response?.status === 403) {
          return handleAuthError(error);
        } else if (!error?.response && (error?.code || error?.message?.includes('Network'))) {
          return handleNetworkError(error);
        } else {
          return handleApiError(error, errorOptions.defaultMessage, errorOptions);
        }
      }
    },
    [handleApiError, handleAuthError, handleNetworkError]
  );

  /**
   * Mostra mensagem de sucesso
   * @param {string} message - Mensagem de sucesso
   */
  const showSuccess = useCallback(
    (message) => {
      showMessage && showMessage(message, 'success');
    },
    [showMessage]
  );

  /**
   * Mostra mensagem de aviso
   * @param {string} message - Mensagem de aviso
   */
  const showWarning = useCallback(
    (message) => {
      showMessage && showMessage(message, 'warning');
    },
    [showMessage]
  );

  /**
   * Mostra mensagem de informação
   * @param {string} message - Mensagem de informação
   */
  const showInfo = useCallback(
    (message) => {
      showMessage && showMessage(message, 'info');
    },
    [showMessage]
  );

  return {
    handleApiError,
    handleValidationError,
    handleAuthError,
    handleNetworkError,
    withErrorHandling,
    showSuccess,
    showWarning,
    showInfo,
  };
};

export default useErrorHandler;
