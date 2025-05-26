import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';

export default [
  { ignores: ['dist', 'node_modules'] },

  // Configuration for React components
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    },
  },

  // Configuration for Node.js files (config files)
  {
    files: ['*.config.js', '*.config.mjs', 'tailwind.config.js', 'postcss.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        module: true,
        require: true,
        __dirname: true,
        __filename: true,
      },
      sourceType: 'script',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // Configuration for ES Module config files
  {
    files: ['vite.config.js', 'vitest.*.config.js', 'eslint.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        __dirname: true,
        __filename: true,
      },
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // Configuration for Cypress files
  {
    files: ['cypress/**/*.js', '**/*.cy.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        cy: true,
        Cypress: true,
        describe: true,
        it: true,
        before: true,
        beforeEach: true,
        after: true,
        afterEach: true,
        expect: true,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
    },
  },

  // Configuration for test files
  {
    files: ['**/*.test.{js,jsx}', '**/__tests__/**/*.{js,jsx}', 'src/tests/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        global: true,
        vi: true,
        describe: true,
        it: true,
        test: true,
        expect: true,
        beforeEach: true,
        afterEach: true,
        beforeAll: true,
        afterAll: true,
        jest: true,
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
];
