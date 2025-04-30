/**
 * Copyright IBM Corp. 2016, 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

import { defineConfig, mergeConfig } from 'vite';
import remarkGfm from 'remark-gfm';
import glob from 'fast-glob';
import path from 'path';
import react from '@vitejs/plugin-react';

// We can't use .mdx files in conjuction with `storyStoreV7`, which we are using to preload stories for CI purposes only.
// MDX files are fine to ignore in CI mode since they don't make a difference for VRT testing
const storyGlobs = [
  './Welcome/Welcome.mdx',
  '../src/**/*.stories.js',
  '../src/**/*.mdx',
  '../src/components/Tile/Tile.mdx',
  '../src/**/next/*.stories.js',
  '../src/**/next/**/*.stories.js',
  '../src/**/next/*.mdx',
  '../src/**/*-story.js',
];

const getAbsolutePath = (packageName) =>
  path.dirname(require.resolve(path.join(packageName, 'package.json')));

const stories = glob.sync(storyGlobs, {
  ignore: ['../src/**/docs/*.mdx', '../src/**/next/docs/*.mdx'],
  cwd: __dirname,
});

const config = {
  addons: [
    {
      name: '@storybook/addon-essentials',
      options: {
        actions: true,
        backgrounds: false,
        controls: true,
        docs: false,
        toolbars: true,
        viewport: true,
      },
    },
    '@storybook/addon-storysource',
    /**
     * For now, the storybook-addon-accessibility-checker fork replaces the @storybook/addon-a11y.
     * Eventually they plan to attempt to get this back into the root addon with the storybook team.
     * See more: https://ibm-studios.slack.com/archives/G01GCBCGTPV/p1697230798817659
     */
    // '@storybook/addon-a11y',
    'storybook-addon-accessibility-checker',
    {
      name: '@storybook/addon-docs',
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  features: {
    previewCsfV3: true,
    buildStoriesJson: true,
  },
  framework: {
    name: getAbsolutePath('@storybook/react-vite'),
    options: {},
  },
  stories,
  typescript: {
    reactDocgen: 'react-docgen', // Favor docgen from prop-types instead of TS interfaces
  },
  async viteFinal(config) {
    return defineConfig(config, {
      esbuild: {
        target: 'es2022',
        include: /\.[jt]sx?$/,
        exclude: [],
        loader: 'tsx',
      },
      optimizeDeps: {
        esbuildOptions: {
          loader: {
            '.js': 'jsx',
            '.ts': 'tsx',
          },
        },
      },
      plugins: [react()],
      resolve: {
        preserveSymlinks: true,
      },
    });
  },

  docs: {
    autodocs: true,
    defaultName: 'Overview',
  },
  logLevel: 'debug',
};

export default config;
