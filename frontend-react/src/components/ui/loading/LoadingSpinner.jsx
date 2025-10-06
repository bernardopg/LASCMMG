import PropTypes from 'prop-types';

/**
 * Loading Spinner Component
 * Unified implementation combining flexibility with app theme
 */
const LoadingSpinner = ({
  size = 'medium',
  color = 'primary',
  message = 'Carregando...',
  className = '',
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16',
  };

  const colorClasses = {
    primary: 'text-lime-500',
    secondary: 'text-slate-400',
    success: 'text-green-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
    white: 'text-white',
  };

  const textColorClasses = {
    primary: 'text-slate-400',
    secondary: 'text-slate-500',
    success: 'text-green-400',
    warning: 'text-amber-400',
    danger: 'text-red-400',
    white: 'text-white',
  };

  return (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
      <div
        className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
        role="status"
        aria-label="Carregando"
      >
        <svg
          className="w-full h-full"
          fill="none"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
      {message && <p className={`text-sm ${textColorClasses[color]} text-center`}>{message}</p>}
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium', 'large', 'xlarge']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'white']),
  message: PropTypes.string,
  className: PropTypes.string,
};

// Alternative inline spinner for smaller use cases
export const InlineSpinner = ({ size = 'small', color = 'primary' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-6 h-6',
  };

  const colorClasses = {
    primary: 'text-lime-500',
    secondary: 'text-slate-400',
    success: 'text-green-500',
    warning: 'text-amber-500',
    danger: 'text-red-500',
    white: 'text-white',
  };

  return (
    <div
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
      role="status"
      aria-label="Carregando"
    >
      <svg
        className="w-full h-full"
        fill="none"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
};

InlineSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'medium']),
  color: PropTypes.oneOf(['primary', 'secondary', 'success', 'warning', 'danger', 'white']),
};

export default LoadingSpinner;
