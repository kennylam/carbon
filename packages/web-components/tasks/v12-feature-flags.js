/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Sass pre-task that turns on the v12 release feature flag
 *
 * Required by `tasks/build-styles.js --v12`, which bakes it into
 * generated component style modules, and v12 Storybook's
 * `css.preprocessorOptions.scss.additionalData`, which still applies to
 * the global stylesheets Vite compiles.
 */
export const v12FeatureFlagPrelude = `@use '@carbon/styles/scss/feature-flags' with ($feature-flags: ('enable-v12-release': true));\n`;
