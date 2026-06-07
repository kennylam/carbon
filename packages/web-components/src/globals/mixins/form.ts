/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import on from './on';
import Handle from '../internal/handle';

/**
 * fire once per session rather than once per component that applies the mixin
 */
let hasWarnedFormMixinDeprecation = false;

/**
 * @param Base The base class
 * @returns A mix-in to handle `formdata` event on the containing form
 *
 * @deprecated This mixin was a stop-gap for form participation before
 *   FACE was broadly supported. Use `FormAssociatedMixin` (`./form-associated`),
 *   which uses `ElementInternals` to participate in form submission natively.
 *   `FormMixin` is retained for backward compatibility and will be removed in
 *   an upcoming major version
 */
const FormMixin = <T extends Constructor<HTMLElement>>(
  Base: T
): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): {
    _hFormdata: Handle | null;
    _handleFormdata(event: Event): void;
    connectedCallback(): void;
    disconnectedCallback(): void;
  };
} & T => {
  if (!hasWarnedFormMixinDeprecation) {
    hasWarnedFormMixinDeprecation = true;
    // eslint-disable-next-line no-console
    console.warn(
      '`FormMixin` is deprecated and will be removed in an upcoming major ' +
        'version. Use `FormAssociatedMixin` (globals/mixins/form-associated), ' +
        'which participates in form submission natively via `ElementInternals`.'
    );
  }

  /**
   * A mix-in class to handle `formdata` event on the containing form
   */
  abstract class FormMixinImpl extends Base {
    /**
     * The handle for `formdata` event listener on the containing form
     * Not using TypeScript `private`
     * https://github.com/microsoft/TypeScript/issues/17744
     *
     * @private
     */
    _hFormdata: Handle | null = null;

    /**
     * Handles `formdata` event.
     *
     * @param event The event.
     */
    abstract _handleFormdata(event: Event): void;

    connectedCallback() {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      super.connectedCallback();
      const form = this.closest('form');
      if (form) {
        this._hFormdata = on(form, 'formdata', this._handleFormdata.bind(this));
      }
    }

    disconnectedCallback() {
      if (this._hFormdata) {
        this._hFormdata = this._hFormdata.release();
      }
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      super.disconnectedCallback();
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return FormMixinImpl as any;
};

export default FormMixin;
