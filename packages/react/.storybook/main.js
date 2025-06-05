/**
 * Copyright IBM Corp. 2016, 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { createRequire } from 'node:module';
import { dirname, join } from 'path';
import glob from 'fast-glob';
import react from '@vitejs/plugin-react';
import remarkGfm from 'remark-gfm';

const require = createRequire(import.meta.url);

function getAbsolutePath(value) {
  return dirname(require.resolve(join(value, 'package.json')));
}

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

export default {
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
  features: {
    previewCsfV3: true,
    buildStoriesJson: true,
    interactions: false, // disable Interactions tab
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
    const { mergeConfig } = await import('vite');

    return mergeConfig(config, {
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
      esbuild: {
        include: /\.[jt]sx?$/,
        exclude: [],
        loader: 'tsx',
      },
      optimizeDeps: {
        esbuildOptions: {
          loader: {
            '.js': 'jsx',
          },
        },
      },
      // plugins: [react()],
      docs: {
        autodocs: true,
        defaultName: 'Overview',
      },
    });
  },
};
