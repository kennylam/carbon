/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * The value a form-associated custom element (FACE) can submit
 */
export type FormValue = File | string | FormData | null;

/**
 * @param Base The base class
 * @returns mixin that turns element into a
 *   [form-associated custom element](https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements)
 *   backed by `ElementInternals`
 *
 * This mixin provides native form submissions: values with
 * `ElementInternals.setFormValue()` are automatically included when the
 * containing `<form>` is submitted or read with `new FormData(form)`. It also
 * surfaces native form/validity (`form`, `labels`, `validity`,
 * `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`)
 * and the form lifecycle callbacks (`formResetCallback`,
 * `formDisabledCallback`, `formStateRestoreCallback`)
 */
const FormAssociatedMixin = <T extends Constructor<HTMLElement>>(
  Base: T
): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): {
    _internals: ElementInternals;
    _getFormValue(): FormValue;
    _setFormValue(value?: FormValue): void;
    get form(): HTMLFormElement | null;
    get labels(): NodeList | null;
    get validity(): ValidityState;
    get validationMessage(): string;
    get willValidate(): boolean;
    checkValidity(): boolean;
    reportValidity(): boolean;
    formResetCallback(): void;
    formDisabledCallback(disabled: boolean): void;
    formStateRestoreCallback(
      state: FormValue,
      mode: 'restore' | 'autocomplete'
    ): void;
  };
} & T => {
  abstract class FormAssociatedMixinImpl extends Base {
    /**
     * Mark element as form-associated custom element so user agent
     * associates it with an ancestor `<form>` and include in submission
     */
    static formAssociated = true;

    /**
     * The `ElementInternals` instance backing form association
     * Not using TypeScript `private`
     * https://github.com/microsoft/TypeScript/issues/17744
     */
    _internals!: ElementInternals;

    /**
     * `true` once the default form value has been captured for reset support
     */
    _hasCapturedFormDefault = false;

    /**
     * Value captured at first render, restored by `formResetCallback`
     */
    _defaultFormValue: unknown;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      if (typeof this.attachInternals === 'function') {
        this._internals = this.attachInternals();
      }
    }

    /**
     * Value submitted with containing form. Override per component to
     * account for `checked`, numeric values, multiple inputs, etc
     *
     * @returns the value to submit, or `null` when the control should not
     *   contribute an entry (e.g. disabled or no value)
     */
    _getFormValue(): FormValue {
      const { disabled, value } = this as unknown as {
        disabled?: boolean;
        value?: FormValue;
      };
      if (disabled || value === undefined || value === null) {
        return null;
      }
      return value;
    }

    /**
     * Pushes the current value into the form. safe to call when
     * `ElementInternals` is unavailable
     *
     * @param value the value to submit. eefaults to `this._getFormValue()`
     */
    _setFormValue(value: FormValue = this._getFormValue()) {
      this._internals?.setFormValue?.(value);
    }

    get form() {
      return this._internals?.form ?? null;
    }

    get labels() {
      return this._internals?.labels ?? null;
    }

    get validity() {
      return this._internals?.validity;
    }

    get validationMessage() {
      return this._internals?.validationMessage ?? '';
    }

    get willValidate() {
      return this._internals?.willValidate ?? false;
    }

    checkValidity() {
      return this._internals?.checkValidity?.() ?? true;
    }

    reportValidity() {
      return this._internals?.reportValidity?.() ?? true;
    }

    /**
     * Called by user agent when the containing form is reset
     */
    formResetCallback() {
      (this as unknown as { value: unknown }).value =
        this._defaultFormValue ?? '';
    }

    /**
     * Called by user agent when an ancestor `<fieldset disabled>` toggles
     *
     * @param disabled The disabled state to mirror onto the control
     */
    formDisabledCallback(disabled: boolean) {
      (this as unknown as { disabled: boolean }).disabled = disabled;
    }

    /**
     * Called by the user agent to restore state (autofill/bfcache)
     *
     * @param state The previously submitted value
     */
    formStateRestoreCallback(state: FormValue) {
      if (typeof state === 'string') {
        (this as unknown as { value: unknown }).value = state;
      }
    }

    /**
     * Syncs form value into `ElementInternals` on every render so native
     * form submission stays in step with control's value
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update(changedProperties: any) {
      // @ts-expect-error - `update` exists on the Lit base class
      super.update(changedProperties);
      if (!this._hasCapturedFormDefault) {
        this._hasCapturedFormDefault = true;
        this._defaultFormValue = (this as unknown as { value: unknown }).value;
      }
      this._setFormValue();
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return FormAssociatedMixinImpl as any;
};

export default FormAssociatedMixin;
