import { useCallback, useState } from 'react';
import { FaSpinner } from 'react-icons/fa';

// Loading Spinner Component com diferentes tamanhos e estilos
export const LoadingSpinner = ({
  size = 'medium',
  color = 'primary',
  fullScreen = false,
  message = 'Carregando...',
}) => {
  // Definir tamanhos dos spinners
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
    xlarge: 'h-16 w-16',
  };

  // Definir cores
  const colorClasses = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    white: 'text-white',
    gray: 'text-gray-500',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  };

  const spinnerClasses = `
    ${sizeClasses[size]}
    ${colorClasses[color]}
    animate-spin
  `;

  // Spinner simples para uso inline
  if (!fullScreen) {
    return (
      <div className="flex items-center justify-center">
        <FaSpinner className={spinnerClasses} aria-hidden="true" />
        {message && (
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{message}</span>
        )}
      </div>
    );
  }

  // Spinner de tela cheia com overlay
  return (
    <div
      className="fixed inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50"
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      <div className="flex flex-col items-center justify-center p-8 rounded-lg bg-white dark:bg-slate-800 shadow-xl border border-gray-200 dark:border-slate-700">
        <FaSpinner
          className={`${sizeClasses.large} ${colorClasses[color]} animate-spin`}
          aria-hidden="true"
        />
        <p className="mt-4 text-lg font-medium text-gray-700 dark:text-gray-200">{message}</p>
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">Aguarde um momento...</div>
      </div>
    </div>
  );
};

// Spinner para botões
export const ButtonSpinner = ({ size = 'small', className = '' }) => {
  return (
    <FaSpinner
      className={`${size === 'small' ? 'h-4 w-4' : 'h-5 w-5'} animate-spin ${className}`}
      aria-hidden="true"
    />
  );
};

// Spinner para cards/seções
export const SectionSpinner = ({ message = 'Carregando dados...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <FaSpinner className="h-8 w-8 text-primary animate-spin" aria-hidden="true" />
      <p className="mt-3 text-gray-600 dark:text-gray-300 text-center">{message}</p>
    </div>
  );
};

// Spinner para tabelas
export const TableSpinner = ({ columns = 3 }) => {
  return (
    <tr>
      <td colSpan={columns} className="text-center py-8">
        <div className="flex flex-col items-center justify-center">
          <FaSpinner className="h-6 w-6 text-primary animate-spin" aria-hidden="true" />
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Carregando dados...</p>
        </div>
      </td>
    </tr>
  );
};

// Hook personalizado para estados de loading
export const useLoading = (initialState = false) => {
  const [loading, setLoading] = useState(initialState);

  const startLoading = useCallback(() => setLoading(true), []);
  const stopLoading = useCallback(() => setLoading(false), []);
  const toggleLoading = useCallback(() => setLoading((prev) => !prev), []);

  return {
    loading,
    startLoading,
    stopLoading,
    toggleLoading,
    setLoading,
  };
};

export default LoadingSpinner;
