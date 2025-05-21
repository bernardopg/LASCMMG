// @ts-check

import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import eslintPluginCypress from 'eslint-plugin-cypress/flat';

export default tseslint.config(
  // Global ignores
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

  // Backend, scripts, root .config.js (CommonJS)
  {
    files: ['backend/**/*.js', 'scripts/**/*.js', '*.config.js'],
    languageOptions: {
      globals: { ...globals.node },
      sourceType: 'commonjs',
      ecmaVersion: 'latest',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },

  // Root .mjs files (ESM)
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

  // Backend Test files (ESM)
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

  // Frontend Vite/ESLint/Cypress Config files (ESM)
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

  // Frontend Tailwind/PostCSS Config files (CommonJS)
  {
    files: [
      'frontend-react/tailwind.config.js',
      'frontend-react/postcss.config.js',
    ],
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

  // Cypress Test files
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

  // React Frontend Source files (ESM)
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
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },

  // Public JS files (likely browser scripts)
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

  {
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }],
    },
  }
);
