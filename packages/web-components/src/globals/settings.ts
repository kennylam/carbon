/**
 * Copyright IBM Corp. 2019, 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

const prefix = 'cds';

/**
 * A selector for natively focusable elements.
 * Custom elements should use `delegatesFocus: true` to be focusable
 * via standard mechanisms rather than being listed here by tag name.
 */
const selectorFocusable = `
  a[href], area[href],
  input:not([disabled]):not([tabindex='-1']),
  button:not([disabled]):not([tabindex='-1']),
  select:not([disabled]):not([tabindex='-1']),
  textarea:not([disabled]):not([tabindex='-1']),
  iframe, object, embed,
  *[tabindex]:not([tabindex='-1']),
  *[contenteditable=true]
`;

export { prefix, selectorFocusable };
