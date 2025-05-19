// @ts-check

import eslint from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint'; // Although not using TS, some configs might need it implicitly
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  // Global ignores
  {
    ignores: [
      'node_modules/',
      '*.json', // Ignore root json files like package.json
      'tournaments/', // Ignore tournament data folders
      'temp/', // Ignore temp folder if exists
    ],
  },

  // Base recommended configuration
  eslint.configs.recommended,

  // Configuration for Node.js files (CommonJS) - typically backend, scripts, and .config.js files
  {
    files: ['backend/**/*.js', 'scripts/**/*.js', '*.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'commonjs',
      ecmaVersion: 'latest',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },

  // Configuration for root ESM files (.mjs extension and vitest.config.js)
  // This ensures eslint.config.mjs itself and vitest.config.js are parsed as modules.
  {
    files: ['eslint.config.mjs', 'vitest.config.js'],
    languageOptions: {
      globals: {
        ...globals.node, // They still run in a Node environment
      },
      sourceType: 'module', // Crucial for import/export syntax
      ecmaVersion: 'latest',
      parser: tseslint.parser, // Explicitly use typescript-eslint parser
    },
    plugins: { // Ensure typescript-eslint plugin is available for this block if parser needs it
      '@typescript-eslint': tseslint.plugin,
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
  },

  // Configuration for NEW React Frontend JS/JSX/TS/TSX files (ES Modules)
  {
    files: ['frontend-react/src/**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      globals: {
        ...globals.browser, // Use Browser global variables
      },
      sourceType: 'module', // Expect import/export
      ecmaVersion: 'latest',
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Enable JSX parsing
        },
      },
    },
    // TODO: Add React specific plugins and rules here after installing them
    // e.g., eslint-plugin-react, eslint-plugin-react-hooks, eslint-plugin-jsx-a11y
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }], // Warn for now, can be error
      'no-console': ['warn', { allow: ['warn', 'error'] }], // Allow console.warn and console.error
      // Add React specific rules later, e.g.:
      // 'react/prop-types': 'off', // If using TypeScript for props
      // 'react/react-in-jsx-scope': 'off', // Not needed with new JSX transform
    },
  },
  // Remove or comment out old frontend/js config if it's no longer used
  // {
  //   files: ['frontend/js/**/*.js'],
  //   languageOptions: {
  //     globals: {
  //       ...globals.browser,
  //     },
  //     sourceType: 'module',
  //     ecmaVersion: 'latest',
  //   },
  //   rules: {
  //     'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
  //     'no-console': 'warn',
  //   },
  // },

  // Prettier recommended configuration (must be last)
  eslintPluginPrettierRecommended,

  // Custom Prettier rule override (optional, but good practice)
  {
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }], // Show as error, adjust endOfLine if needed
    },
  }
);
