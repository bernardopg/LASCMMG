/**
 * ESLint configuration for LASCMMG project
 *
 * This configuration handles both backend (Node.js) and frontend (React) code
 * with appropriate rule sets for each environment.
 *
 * @ts-check
 */

import eslint from '@eslint/js';
import eslintPluginCypress from 'eslint-plugin-cypress/flat';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import nPlugin from 'eslint-plugin-n';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import securityPlugin from 'eslint-plugin-security';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Global ignores - files and directories to exclude from linting
  {
    ignores: [
      'node_modules/',
      '*.json',
      'tournaments/',
      'temp/',
      'frontend-react/dist/',
      'frontend-react/coverage/',
    ],
  },

  eslint.configs.recommended,

  // Backend Node.js files (CommonJS format)
  {
    files: ['backend/**/*.js', 'scripts/**/*.js', '*.config.js'],
    plugins: {
      security: securityPlugin,
      n: nPlugin,
    },
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'commonjs',
      ecmaVersion: 'latest',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error',
      'security/detect-object-injection': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-unsafe-regex': 'warn',
      'security/detect-buffer-noassert': 'error',
      'n/no-deprecated-api': 'warn',
    },
  },

  // Root .mjs config files (ES modules)
  {
    files: ['eslint.config.mjs', 'vitest.config.js'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'module',
      ecmaVersion: 'latest',
      parser: tseslint.parser,
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Backend test files (using Vitest/Jest syntax)
  {
    files: ['backend/tests/**/*.js'],
    languageOptions: {
      globals: { ...globals.node, ...globals.es2021 },
      sourceType: 'module',
      ecmaVersion: 'latest',
      parser: tseslint.parser,
    },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Frontend configuration files (Vite, ESLint, Cypress)
  {
    files: [
      'frontend-react/vite.config.js',
      'frontend-react/eslint.config.js',
      'frontend-react/cypress.config.js',
    ],
    languageOptions: {
      globals: { ...globals.node, process: 'readonly', caches: 'readonly' },
      sourceType: 'module',
      ecmaVersion: 'latest',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Frontend styling configuration files (Tailwind, PostCSS)
  {
    files: ['frontend-react/tailwind.config.js', 'frontend-react/postcss.config.js'],
    languageOptions: {
      globals: { ...globals.node, require: 'readonly', module: 'readonly' },
      sourceType: 'commonjs',
      ecmaVersion: 'latest',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      '@typescript-eslint/no-var-requires': 'off',
    },
  },

  // End-to-end test files (Cypress)
  {
    files: ['frontend-react/cypress/**/*.cy.js'],
    ...eslintPluginCypress.configs.recommended, // Spread the recommended config here
    // This should include the plugin and globals.
    // languageOptions and rules can be further customized below if needed,
    // but the spread should handle the basics.
    rules: {
      // Override or add to recommended rules if necessary
      ...(eslintPluginCypress.configs.recommended.rules || {}), // Ensure rules are spread if not already by top-level spread
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // React application source code
  {
    files: ['frontend-react/src/**/*.{js,jsx,ts,tsx}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    languageOptions: {
      globals: { ...globals.browser },
      sourceType: 'module',
      ecmaVersion: 'latest',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...jsxA11yPlugin.configs.recommended.rules,
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-no-bind': ['warn', { allowArrowFunctions: true }],
      'react-hooks/exhaustive-deps': 'warn',
      'jsx-a11y/anchor-is-valid': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
      'jsx-a11y/aria-role': ['error', { ignoreNonDOM: true }],
    },
  },

  // Browser scripts in public directory
  {
    files: ['frontend-react/public/js/**/*.js'],
    languageOptions: {
      globals: { ...globals.browser },
      sourceType: 'script',
      ecmaVersion: 'latest',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },

  eslintPluginPrettierRecommended,

  // Global prettier configuration
  {
    rules: {
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
          singleQuote: true,
          trailingComma: 'es5',
          printWidth: 100,
          tabWidth: 2,
        },
      ],
    },
  }
);
