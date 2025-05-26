import React, { useState } from 'react';
import { Field, ErrorMessage } from 'formik';

/**
 * Componente de campo de formulário reutilizável com validação visual
 */
const FormField = ({
  name,
  label,
  type = 'text',
  placeholder,
  required = false,
  showPasswordToggle = false,
  icon: Icon,
  errors,
  touched,
  className = '',
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const hasError = errors && touched && errors[name] && touched[name];

  const inputType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      {/* Label */}
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      {/* Input Container */}
      <div className="relative">
        {/* Icon */}
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className={`h-5 w-5 ${hasError ? 'text-red-400' : 'text-gray-400'}`} />
          </div>
        )}

        {/* Input Field */}
        <Field
          id={name}
          name={name}
          type={inputType}
          autoComplete={
            type === 'email' ? 'email' : type === 'password' ? 'current-password' : 'off'
          }
          className={`
            appearance-none relative block w-full px-3 py-3
            ${Icon ? 'pl-10' : ''}
            ${showPasswordToggle ? 'pr-10' : ''}
            border rounded-lg shadow-sm placeholder-gray-400
            focus:outline-none focus:ring-2 focus:ring-offset-0 focus:z-10
            text-sm transition-colors duration-200
            ${
              hasError
                ? 'border-red-300 text-red-900 focus:ring-red-500 focus:border-red-500 bg-red-50 dark:bg-red-900/10 dark:border-red-500 dark:text-red-100'
                : 'border-gray-300 dark:border-slate-600 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-slate-700'
            }
            ${className}
          `}
          placeholder={placeholder}
          {...props}
        />

        {/* Password Toggle */}
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            {showPassword ? (
              <svg
                className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Error Message */}
      <ErrorMessage
        name={name}
        component="div"
        className="text-sm text-red-600 dark:text-red-400 flex items-center mt-1"
      />
    </div>
  );
};

export default FormField;
