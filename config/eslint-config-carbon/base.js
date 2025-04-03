/**
 * Copyright IBM Corp. 2018, 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */
import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import { fixupPluginRules } from '@eslint/compat';
import testingLibrary from 'eslint-plugin-testing-library';
import globals from 'globals';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginReact from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

/**
 * A shared ESLint configuration for the repository.
 *
 * @type {import("eslint").Linter.Config[]}
 * */
export const config = [
  js.configs.recommended,
  eslintConfigPrettier,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.es2020,
        ...globals.jasmine,
        ...globals.jest,
        ...globals.node,
        ...globals.serviceworker,
      },
    },
  },
  {
    // Global rules
    rules: {
      '@typescript-eslint/no-require-imports': 0,
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-empty-function': 'off', // Disabled to support default empty functions used in PropTypes
      '@typescript-eslint/no-explicit-any': 'off', // TODO: Enable once stricter typings of internal utilities are supported
      '@typescript-eslint/ban-ts-comment': 'off', // Disabled to allow some instances where we won't be able to fix type errors
    },
  },
  {
    // React hooks rules
    plugins: {
      'react-hooks': pluginReactHooks,
    },
    settings: { react: { version: 'detect' } },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
      // React scope no longer necessary with new JSX transform.
      'react/react-in-jsx-scope': 'off',
    },
  },
  {
    files: ['packages/react/**/*-test.js'],
    plugins: {
      'testing-library': fixupPluginRules({
        rules: testingLibrary.rules,
      }),
    },
    rules: {
      ...testingLibrary.configs.react.rules,
      'testing-library/no-node-access': [
        'error',
        { allowContainerFirstChild: true },
      ],
    },
  },
  {
    ignores: [
      // Build folders
      '**/build/*',
      '**/dist/*',
      '**/demo/*',
      '**/es/*',
      '**/es-custom/*',
      '**/lib/*',
      '**/umd/*',
      '**/node_modules/*',

      // Components
      'packages/components/demo/*.css',
      'packages/components/demo/*.map',
      'packages/components/demo/*.js',
      'packages/components/demo/js/prism.js',
      'packages/components/demo/hot',
      '!packages/components/demo/index.js', // This negation might need manual handling
      'packages/components/dist',
      'packages/components/tests/a11y-results',
      'packages/components/tests/coverage',
      'packages/components/es',
      'packages/components/umd',
      'packages/components/scripts',
      'packages/components/css',
      'packages/components/scss',
      'packages/components/html',
      'packages/components/docs/js',
      'packages/components/node_modules',
      'packages/components/scss/globals/vendor/**',
      'packages/components/src/globals/scss/vendor/**',

      // Upgrade
      '**/__testfixtures__/**',
      'packages/upgrade/cli.js',

      // React
      '**/storybook-static/**',
      'packages/react/icons/index.js',
      'packages/react/icons/index.esm.js',

      // Icons React
      'packages/icons-react/next/**',

      // Templates
      'packages/cli/src/component/templates/**',

      // Web Components
      'packages/web-components/**',
      'packages/web-components/tests/**',
      'packages/web-components/**/*.d.ts',
    ],
  },
];
