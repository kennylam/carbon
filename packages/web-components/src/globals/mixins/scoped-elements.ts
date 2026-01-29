/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ScopedElementsMixin as OpenWCScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';

let hasWarned = false;

const supportsScopedRegistry = () => {
  if (typeof CustomElementRegistry === 'undefined') {
    return false;
  }

  try {
    // Scoped custom element registries require a constructible registry.
    // The polyfill makes this constructor available.
    new CustomElementRegistry();
    return true;
  } catch {
    return false;
  }
};

if (typeof window !== 'undefined' && !supportsScopedRegistry() && !hasWarned) {
  hasWarned = true;
  // eslint-disable-next-line no-console -- avoid silent failure when scoped elements are used without the polyfill
  console.warn(
    '[Carbon Web Components] Scoped custom element registry polyfill not detected. ' +
      'Scoped elements will fall back to the global registry and may collide. ' +
      'Import "@carbon/web-components/scoped-elements" or ' +
      '"@webcomponents/scoped-custom-element-registry" before defining any custom elements.'
  );
}

export const ScopedElementsMixin = OpenWCScopedElementsMixin;
