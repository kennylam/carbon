/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

/**
 * Compiles each `.scss` file that a component imports into a sibling
 * `.scss.ts` module exporting a `lit` `CSSResult`.
 *
 * This replaces compiling SCSS inside the bundler. Because the generated
 * modules are plain TypeScript, neither the package build nor Storybook needs
 * a `.scss` loader plugin, and the imports typecheck as `CSSResult` instead of
 * resolving to an untyped `declare module` wildcard as they did previously.
 */

import { fileURLToPath, pathToFileURL } from 'url';
import { globby } from 'globby';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import fs from 'fs/promises';
import path from 'path';
import fixHostPseudo from '../tools/postcss-fix-host-pseudo.js';
import postcss from 'postcss';
import * as sass from 'sass';
import { escapeForTemplate, verifyRoundTrip } from './lit-css-template.js';
import { v12FeatureFlagPrelude } from './v12-feature-flags.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const packageRoot = path.resolve(__dirname, '..');

/**
 * Matches the style imports this generator is responsible for, in both the
 * legacy `?lit` query form and the generated-module form, so the generator
 * works before, during, and after the migration.
 */
const STYLE_IMPORT_RE = /from\s+'([^']+?\.scss)(?:\?lit|\.js)'/g;

/**
 * Mirrors the prelude the previous bundler plugin injected, so compiled output
 * is unchanged. `@carbon/styles` already defaults this flag on; it is kept for
 * parity with the pre-codegen pipeline.
 */
const sassPrelude = `$feature-flags: (
  enable-css-custom-properties: true,
);
`;

/**
 * The `dist`/CDN bundle additionally runs `fixHostPseudo`, which rewrites
 * `:host(x):hover` into `:host(x:hover)`. It must run before minification, and
 * it is deliberately NOT applied to `es`/`lib`, matching the pre-codegen
 * pipeline exactly. `build:dist` regenerates these modules with `--dist`.
 */
const isDist = process.argv.includes('--dist');

/**
 * The v12 Storybook used to inject this through Vite's
 * `css.preprocessorOptions.scss.additionalData`, which only reached our SCSS
 * while the bundler compiled it. Generated modules are built ahead of the
 * bundler, so the flag is injected here instead.
 */
const isV12 = process.argv.includes('--v12');

const postCSSPlugins = isDist
  ? [fixHostPseudo(), autoprefixer(), cssnano()]
  : [autoprefixer(), cssnano()];

const loadPaths = [
  path.resolve(packageRoot, 'node_modules'),
  path.resolve(packageRoot, '../../node_modules'),
];

/**
 * Finds every `.scss` file imported as a style module.
 *
 * @returns {Promise<{targets: string[], bare: Map<string, string[]>}>} Absolute
 *   paths of local SCSS entry points, plus any bare specifiers keyed by
 *   specifier to the importers that reference them.
 */
async function collectTargets() {
  const sources = await globby(
    [
      'src/**/*.{ts,js}',
      '.storybook/**/*.{ts,js}',
      '.storybook-v12/**/*.{ts,js}',
      '!**/*.d.ts',
    ],
    // `dot: true` so the Storybook config directories are not skipped.
    { cwd: packageRoot, absolute: true, dot: true }
  );

  const targets = new Set();
  const bare = new Map();

  await Promise.all(
    sources.map(async (source) => {
      const contents = await fs.readFile(source, 'utf8');

      for (const [, specifier] of contents.matchAll(STYLE_IMPORT_RE)) {
        if (specifier.startsWith('.')) {
          targets.add(path.resolve(path.dirname(source), specifier));
        } else {
          bare.set(specifier, [...(bare.get(specifier) ?? []), source]);
        }
      }
    })
  );

  return { targets: [...targets].sort(), bare };
}

/**
 * Compiles one SCSS file to a `.scss.ts` module.
 *
 * @param {string} file The absolute path to the SCSS file.
 * @returns {Promise<string>} The absolute path to the generated module.
 */
async function generate(file) {
  const contents = await fs.readFile(file, 'utf8');

  const prelude = `${isV12 ? v12FeatureFlagPrelude : ''}${sassPrelude}`;

  const { css: compiled } = sass.compileString(`${prelude}${contents}`, {
    url: pathToFileURL(file),
    loadPaths,
  });

  const { css } = await postcss(postCSSPlugins).process(compiled.toString(), {
    from: file,
  });

  const escaped = escapeForTemplate(css);
  verifyRoundTrip(escaped, css, path.relative(packageRoot, file));

  const destination = `${file}.ts`;

  // No license banner here: these modules are build artifacts, and the bundler
  // prepends the banner to every emitted file. Adding one would duplicate it.
  await fs.writeFile(
    destination,
    `// Generated from ./${path.basename(file)} by tasks/build-styles.js. Do not edit.

import { css } from 'lit';

export default css\`${escaped}\`;
`
  );

  return destination;
}

async function buildStyles() {
  const { targets, bare } = await collectTargets();

  for (const [specifier, importers] of bare) {
    const from = importers
      .map((importer) => path.relative(packageRoot, importer))
      .join(', ');
    throw new Error(
      `[build-styles] cannot generate a style module for the bare specifier '${specifier}' imported by ${from}. Import it through a local .scss file that '@use's it instead.`
    );
  }

  const generated = await Promise.all(targets.map(generate));

  console.log(
    `[build-styles] generated ${generated.length} style modules${
      isDist ? ' (dist flavor)' : isV12 ? ' (v12 flavor)' : ''
    }`
  );

  return generated;
}

// Only run when invoked directly, so tests can import the helpers above.
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  buildStyles().catch((error) => {
    console.error(error.message ?? error);
    process.exitCode = 1;
  });
}
