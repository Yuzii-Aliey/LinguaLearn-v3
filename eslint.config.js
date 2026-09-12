/**
 * ESLint flat config (v9).
 *
 * Focuses on real bug classes: unresolved imports, undefined variables,
 * accidental globals. Formatting is left to the editor; no style rules.
 */

import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'tests/**/*.js', 'netlify/**/*.js', '*.config.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      // Cloud Functions run on Node 18+; console logging is intentional
      // in the client (offline fallbacks log their degradation).
      'no-console': 'off',
    },
  },
];
