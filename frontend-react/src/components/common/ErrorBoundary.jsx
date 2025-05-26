import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log para serviço de monitoramento (Sentry, LogRocket, etc.)
    if (window.analytics) {
      window.analytics.track('Error Boundary Triggered', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
      });
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;

    if (retryCount < 3) {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: retryCount + 1,
      });
    } else {
      // Redirecionar para home após 3 tentativas
      window.location.href = '/';
    }
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { error, retryCount } = this.state;
      const { fallback: CustomFallback, showDetails = false } = this.props;

      // Se um componente fallback customizado foi fornecido
      if (CustomFallback) {
        return (
          <CustomFallback
            error={error}
            onRetry={this.handleRetry}
            onGoHome={this.handleGoHome}
            retryCount={retryCount}
          />
        );
      }

      // Fallback padrão
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <div className="text-center">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Oops! Algo deu errado
              </h1>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Ocorreu um erro inesperado. Nossa equipe foi notificada automaticamente.
              </p>

              {showDetails && error && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Detalhes técnicos
                  </summary>
                  <div className="bg-gray-100 dark:bg-slate-700 p-3 rounded text-xs font-mono text-gray-800 dark:text-gray-200 overflow-auto max-h-32">
                    <div className="font-semibold mb-1">Erro:</div>
                    <div className="mb-2">{error.message}</div>
                    {error.stack && (
                      <>
                        <div className="font-semibold mb-1">Stack:</div>
                        <div>{error.stack}</div>
                      </>
                    )}
                  </div>
                </details>
              )}

              <div className="space-y-3">
                {retryCount < 3 ? (
                  <button
                    onClick={this.handleRetry}
                    className="w-full btn btn-primary flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Tentar Novamente ({3 - retryCount} tentativas restantes)</span>
                  </button>
                ) : (
                  <button
                    onClick={this.handleReload}
                    className="w-full btn btn-primary flex items-center justify-center space-x-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Recarregar Página</span>
                  </button>
                )}

                <button
                  onClick={this.handleGoHome}
                  className="w-full btn btn-outline flex items-center justify-center space-x-2"
                >
                  <Home className="w-4 h-4" />
                  <span>Ir para Página Inicial</span>
                </button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-600">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Se o problema persistir, entre em contato com o suporte.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
