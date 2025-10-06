import PropTypes from 'prop-types';

/**
 * Reusable Card Component
 * Provides consistent card styling across the application
 */
const Card = ({
  children,
  title,
  subtitle,
  footer,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  className = '',
}) => {
  // Variant classes
  const variantClasses = {
    default: 'bg-slate-800 border border-slate-700',
    elevated: 'bg-slate-800 border border-slate-700 shadow-lg',
    gradient: 'bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700',
  };

  // Padding classes
  const paddingClasses = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  // Hover effect
  const hoverClass = hoverable
    ? 'transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer'
    : '';

  return (
    <div
      className={`
        rounded-xl
        ${variantClasses[variant]}
        ${paddingClasses[padding]}
        ${hoverClass}
        ${className}
      `
        .trim()
        .replace(/\s+/g, ' ')}
    >
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-lg font-bold text-slate-100">{title}</h3>}
          {subtitle && <p className="text-sm text-slate-400 mt-1">{subtitle}</p>}
        </div>
      )}

      <div className="card-content">{children}</div>

      {footer && <div className="mt-4 pt-4 border-t border-slate-700">{footer}</div>}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  footer: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'elevated', 'gradient']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  hoverable: PropTypes.bool,
  className: PropTypes.string,
};

export default Card;
