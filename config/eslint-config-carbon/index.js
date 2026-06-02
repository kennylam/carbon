/**
 * Copyright IBM Corp. 2018, 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import js from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * base config: ESLint recommended, typescript-eslint (strict),
 * Carbon conventions
 *
 * @type {import('eslint').Linter.Config[]}
 */
export const base = [
  js.configs.recommended,
  ...tseslint.configs.strict,
  {
    name: 'carbon/base',
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      'no-console': 'error',
      'no-template-curly-in-string': 'error',
      'prefer-arrow-callback': ['error', { allowNamedFunctions: true }],
      'require-atomic-updates': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true },
      ],
    },
  },
  {
    name: 'carbon/base/commonjs',
    files: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];

/**
 * react configuration: jsx-a11y, react-hooks recommended, @eslint-react
 *
 * @type {import('eslint').Linter.Config[]}
 */
export const react = [
  {
    name: 'carbon/react/jsx',
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
  },
  jsxA11y.flatConfigs.recommended,
  {
    name: 'carbon/react/react-hooks',
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // classic react-hooks rules only (parity with v5's recommended).
      // react compiler rules added in react-hooks v7 (`refs`,
      // `set-state-in-effect`, `immutability`, `static-components`, etc) are
      // intentionally deferred and should be addressed incrementally
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  // register @eslint-react with everything off, then opt in
  eslintReact.configs.off,
  {
    name: 'carbon/react/eslint-react',
    files: ['**/*.{js,jsx,ts,tsx}'],
    rules: {
      '@eslint-react/no-missing-key': 'error',
      '@eslint-react/no-duplicate-key': 'error',
      '@eslint-react/no-direct-mutation-state': 'error',
      '@eslint-react/jsx-no-children-prop': 'error',
      '@eslint-react/dom-no-find-dom-node': 'error',
      '@eslint-react/dom-no-render-return-value': 'error',
      '@eslint-react/jsx-no-comment-textnodes': 'error',
    },
  },
];

/**
 * Testing-library rules for React test files
 *
 * @type {import('eslint').Linter.Config[]}
 */
export const testing = [
  {
    name: 'carbon/testing-library',
    files: [
      '**/__tests__/**/*.{js,jsx,ts,tsx}',
      '**/*.{test,spec}.{js,jsx,ts,tsx}',
    ],
    plugins: {
      'testing-library': testingLibrary,
    },
    rules: {
      ...testingLibrary.configs.react.rules,
    },
  },
];

/**
 * recommended Carbon config: base + React; this is the default export.
 *
 * @type {import('eslint').Linter.Config[]}
 */
export const recommended = [...base, ...react];

export default recommended;
