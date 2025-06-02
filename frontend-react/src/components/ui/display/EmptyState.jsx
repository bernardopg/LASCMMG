import React from 'react';
import { AlertTriangle, Info, Search, XCircle } from 'lucide-react';

/**
 * Empty State Component
 * Used to display when no data is available or when a section is empty
 */
const iconMap = {
  warning: AlertTriangle,
  info: Info,
  search: Search,
  error: XCircle,
  default: Info, // Default icon
};

const EmptyState = ({
  iconName = 'default', // 'warning', 'info', 'search', 'error', or a custom SVG component
  title,
  message,
  actions, // Optional: array of action buttons/links like { label: string, onClick: func, primary: bool }
  className = '',
  iconClassName = 'w-12 h-12 text-gray-500', // Default icon styling
  titleClassName = 'text-lg font-medium text-gray-100 mb-2',
  messageClassName = 'text-gray-400',
}) => {
  const IconComponent =
    typeof iconName === 'string' ? iconMap[iconName] || iconMap.default : iconName;

  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="flex justify-center items-center mb-4">
        <IconComponent className={iconClassName} aria-hidden="true" />
      </div>
      <h3 className={titleClassName}>{title}</h3>
      {message && <p className={messageClassName}>{message}</p>}
      {actions && actions.length > 0 && (
        <div className="mt-6 flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-3">
          {actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`btn ${action.primary ? 'btn-primary' : 'btn-outline'} text-sm`}
            >
              {action.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmptyState;
