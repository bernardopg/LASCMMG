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

  // Configuration for Node.js files (CommonJS)
  {
    files: ['backend/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node, // Use Node.js global variables
      },
      sourceType: 'commonjs', // Expect require/module.exports
      ecmaVersion: 'latest',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console logs in backend for now
    },
  },

  // Configuration for Frontend JS files (ES Modules)
  {
    files: ['frontend/js/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser, // Use Browser global variables
      },
      sourceType: 'module', // Expect import/export
      ecmaVersion: 'latest',
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off', // Allow console logs in frontend for now
    },
  },

  // Prettier recommended configuration (must be last)
  eslintPluginPrettierRecommended,

  // Custom Prettier rule override (optional, but good practice)
  {
    rules: {
      'prettier/prettier': ['error', { endOfLine: 'auto' }], // Show as error, adjust endOfLine if needed
    },
  }
);
