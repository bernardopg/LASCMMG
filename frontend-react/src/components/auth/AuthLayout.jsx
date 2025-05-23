import React from 'react';
import { Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';

/**
 * Layout comum para páginas de autenticação
 * Centraliza o design e comportamento das páginas de login/registro
 */
const AuthLayout = ({
  children,
  title,
  subtitle,
  alternativeText,
  alternativeLink,
  alternativeLinkText,
  showLogo = true,
  maxWidth = "md"
}) => {
  const { theme } = useTheme();

  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl"
  };

  return (
    <div className="min-h-screen flex flex-col justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 py-8 px-4 sm:px-6 lg:px-8">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5 dark:opacity-10"></div>

      <div className="relative z-10 mx-auto w-full space-y-8">
        {/* Logo Section */}
        {showLogo && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="relative">
                <img
                  src="/assets/logo-lascmmg.png"
                  alt="LASCMMG Logo"
                  className="h-16 w-auto transition-all duration-300 hover:scale-105 filter drop-shadow-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 hover:opacity-10 rounded-lg transition-opacity duration-300"></div>
              </div>
            </div>
            <div className="space-y-1">
              <h1 className="text-sm font-medium text-gray-600 dark:text-gray-400 tracking-wide uppercase">
                Liga Acadêmica de Sinuca - CMMG
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Sistema de Gerenciamento de Torneios
              </p>
            </div>
          </div>
        )}

        {/* Auth Card */}
        <div className={`mx-auto w-full ${maxWidthClasses[maxWidth]} space-y-6`}>
          <div className="bg-white dark:bg-slate-800 shadow-2xl rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-8 sm:px-8 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700">
              <div className="text-center space-y-2">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                  {title}
                </h2>
                {subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 max-w-sm mx-auto">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-8 sm:px-8">
              {children}
            </div>
          </div>

          {/* Alternative Action */}
          {alternativeText && alternativeLink && alternativeLinkText && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {alternativeText}{' '}
                <Link
                  to={alternativeLink}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  {alternativeLinkText}
                </Link>
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300 dark:border-slate-600"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-gray-500 dark:text-gray-400">
                  LASCMMG &copy; {new Date().getFullYear()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
