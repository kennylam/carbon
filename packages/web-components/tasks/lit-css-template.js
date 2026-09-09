/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Embedding compiled CSS in a `css` tagged template, make sure it survives
 *
 * Kept free of build deps so it can be unit tested on its own
 */

/**
 * Escapes CSS for embedding in a tagged template literal
 *
 * Backslashes are the main reason this is needed. Carbon's compiled CSS contains
 * escaped selectors such as `.cds--grid\:col-span-4` and content escapes such
 * as `\2014`, and each breaks a different way if left unescaped:
 *
 * - `\:` is a NonEscapeCharacter, so the backslash is silently dropped and the
 * selector turns into a pseudo-class - no error is flagged
 * - `\2014` is a legacy escape, which is a SyntaxError in a template literal and
 * becomes to `undefined` in a tagged one
 *
 * @param {string} css The CSS to escape
 * @returns {string} The escaped CSS
 */
export function escapeForTemplate(css) {
  return css
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');
}

/**
 * Asserts that a template literal built from `escaped` converts back to `css`
 *
 * Use real JS template-literal checks instead of re-implementing escape processing,
 * keeping this check isolated from `escapeForTemplate`
 *
 * @param {string} escaped The escaped CSS
 * @param {string} css The original CSS
 * @param {string} source The SCSS file, for error reporting
 * @throws {Error} If the escaped form does not cook back to `css`
 */
export function verifyRoundTrip(escaped, css, source) {
  let cooked;

  try {
    cooked = new Function(`return \`${escaped}\`;`)();
  } catch (error) {
    throw new Error(
      `[build-styles] escaped CSS for ${source} is not a valid template literal: ${error.message}`
    );
  }

  if (cooked !== css) {
    throw new Error(
      `[build-styles] escaped CSS for ${source} does not round-trip; refusing to emit corrupt styles`
    );
  }
}
