/**
 * Copyright IBM Corp. 2016, 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';
import { createRequire } from 'node:module';

import remarkGfm from 'remark-gfm';
import glob from 'fast-glob';
import { dirname, join } from 'path';
import react from '@vitejs/plugin-react';
import { mergeConfig } from 'vite';

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, 'package.json')));
}

const require = createRequire(import.meta.url);

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

const stories = glob.sync(storyGlobs, {
  ignore: ['../src/**/docs/*.mdx', '../src/**/next/docs/*.mdx'],
  cwd: __dirname,
});

const config = {
  addons: [
    {
      name: getAbsolutePath('@storybook/addon-docs'),
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
  ],
  core: {
    builder: getAbsolutePath('@storybook/builder-vite'),
  },
  features: {
    previewCsfV3: true,
    buildStoriesJson: true,
    interactions: process.env.NODE_ENV !== 'production', // disable interactions in production builds, but enabled in development
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
    return mergeConfig(config, {
      esbuild: {
        include: /\.[jt]sx?$/,
        exclude: [],
        loader: 'tsx',
      },
      css: {
        preprocessorOptions: {
          // suppress mixed-declarations warnings until resolved in
          // https://github.com/carbon-design-system/carbon/issues/16962
          scss: {
            api: 'modern',
            silenceDeprecations: ['mixed-decls'],
          },
        },
      },
      optimizeDeps: {
        esbuildOptions: {
          loader: {
            '.js': 'jsx',
          },
        },
      },
      plugins: [
        react({
          include: '**/*.{jsx,js,ts,tsx}',
          babel: {
            presets: ['babel-preset-carbon'],
            babelrc: false,
            configFile: false,
          },
        }),
      ],
      resolve: {
        preserveSymlinks: true,
      },
    });
  },
  docs: {
    defaultName: 'Overview',
  },
};

export default config;
