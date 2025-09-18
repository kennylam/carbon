/**
 * Copyright IBM Corp. 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import path from 'path';
import { fileURLToPath } from 'url';
import * as sass from 'sass';
import postcss from 'postcss';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import fs from 'fs-extra';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// get all carbon component stylesheets
async function discoverCarbonComponents() {
  const carbonStylesPath = path.resolve(
    __dirname,
    '../../../packages/styles/scss/components'
  );

  // find all _index.scss files in component directories
  const componentIndexFiles = await glob('*/_index.scss', {
    cwd: carbonStylesPath,
    absolute: true,
  });

  // extract component names and create import statements
  const componentImports = componentIndexFiles.map((filePath) => {
    const componentName = path.basename(path.dirname(filePath));
    return `@use '@carbon/styles/scss/components/${componentName}' as *;`;
  });

  return componentImports.sort();
}

// extract and compile
async function extractSharedStyles() {
  const outputDir = path.resolve(__dirname, '../dist/stylesheets');

  await fs.ensureDir(outputDir);

  const componentImports = await discoverCarbonComponents();
  console.log(`📦 Discovered ${componentImports.length} Carbon components`);

  const sharedStyleSources = {
    core: `
      $feature-flags: (
        enable-css-custom-properties: true,
      );

      @use '@carbon/styles/scss/config' as *;
      @use '@carbon/styles/scss/spacing' as *;
      @use '@carbon/styles/scss/colors';
      @use '@carbon/styles/scss/motion' as *;
      @use '@carbon/styles/scss/type' as *;
      @use '@carbon/styles/scss/themes' as *;
      @use '@carbon/styles/scss/theme' as *;
      @use '@carbon/styles/scss/utilities/convert' as *;
      @use '@carbon/styles/scss/utilities' as *;
    `,

    reset: `
      @use '@carbon/styles/scss/reset' as *;
    `,

    fonts: `
      @use '@carbon/styles/scss/fonts' as *;
    `,

    grid: `
      @use '@carbon/styles/scss/grid' as *;
    `,

    layout: `
      @use '@carbon/styles/scss/layer' as *;
      @use '@carbon/styles/scss/layout' as *;
      @use '@carbon/styles/scss/zone' as *;
    `,

    component: `
      ${componentImports.join('\n')}
    `,

    utility: `
      @use '@carbon/styles/scss/utilities/ai-gradient' as *;
    `,
  };

  const compiledStyles = {};

  for (const [category, scssContent] of Object.entries(sharedStyleSources)) {
    try {
      const result = sass.renderSync({
        data: scssContent,
        includePaths: [
          path.resolve(__dirname, '../node_modules'),
          path.resolve(__dirname, '../../../node_modules'),
          path.resolve(__dirname, '../../../packages/styles/scss'),
        ],
        outputStyle: 'compressed',
      });

      const processedCss = await postcss([autoprefixer(), cssnano()]).process(
        result.css.toString(),
        { from: undefined }
      );

      compiledStyles[category] = processedCss.css;

      const cssPath = path.join(outputDir, `${category}-styles.css`);
      await fs.writeFile(cssPath, processedCss.css);
    } catch (error) {
      console.error(`error compiling ${category} styles:`, error.message);
    }
  }

  // combine all shared styles into a single file
  try {
    const combinedCss = Object.values(compiledStyles).join('\n');
    const combinedPath = path.join(outputDir, 'shared-styles.css');
    await fs.writeFile(combinedPath, combinedCss);
  } catch (error) {
    console.error('Error combining shared styles:', error);
  }

  console.log(`output directory: ${outputDir}`);
}

extractSharedStyles().catch((error) => {
  console.error('shared styles extraction failed:', error);
  process.exit(1);
});
