/**
 * Copyright IBM Corp. 2020, 2022
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Form validation status.
 */
export enum VALIDATION_STATUS {
  /**
   * One indicating no validation error.
   */
  NO_ERROR = '',

  /**
   * One indicating missing required value.
   */
  ERROR_REQUIRED = 'required',
}

/**
 * @param Base The base class.
 * @returns A mix-in implementing `.setCustomValidity()` method.
 */
const ValidityMixin = <T extends Constructor<HTMLElement>>(
  Base: T
): {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: any[]): {
    _getValidityMessage(state: string): string | undefined;
    _testValidity(): string;
    _customValidityMessage: string;
    _refreshInternalsValidity(): void;
    get _validityAnchor(): HTMLElement | undefined;
    invalid: boolean;
    required: boolean;
    requiredValidityMessage: string;
    validityMessage: string;
    get value(): string;
    set value(v: string);
    checkValidity(): boolean;
    reportValidity(): boolean;
    setCustomValidity(validityMessage: string): void;
  };
} & T => {
  abstract class ValidityMixinImpl extends Base {
    // Typed as `string` rather than `VALIDATION_STATUS` so subclasses can
    // return their own statuses, e.g. `NUMBER_INPUT_VALIDATION_STATUS`
    /**
     * Not using TypeScript `private`
     * https://github.com/microsoft/TypeScript/issues/17744
     *
     * @param state The form validation status.
     * @returns The form validation error messages associated with the given status.
     * @protected
     */
    _getValidityMessage(state: string) {
      return {
        [VALIDATION_STATUS.NO_ERROR]: '',
        [VALIDATION_STATUS.ERROR_REQUIRED]: this.requiredValidityMessage,
      }[state];
    }

    // Typed as `string` rather than `VALIDATION_STATUS` so subclasses can
    // return their own statuses, e.g. `NUMBER_INPUT_VALIDATION_STATUS`
    /**
     * Checks if the value meets the constraints.
     * Not using TypeScript `private`
     * https://github.com/microsoft/TypeScript/issues/17744
     *
     * @returns `VALIDATION_STATUS.NO_ERROR` if the value meets the constraints. Some other values otherwise.
     * @protected
     */
    _testValidity(): string {
      const { required, value } = this;
      return required && !value
        ? VALIDATION_STATUS.ERROR_REQUIRED
        : VALIDATION_STATUS.NO_ERROR;
    }

    /**
     * `true` to show the UI of the invalid state.
     */
    abstract invalid: boolean;

    /**
     * `true` if the value is required.
     */
    abstract required: boolean;

    /**
     * The special validity message for `required`.
     */
    abstract requiredValidityMessage: string;

    /**
     * The validity message.
     */
    abstract validityMessage: string;

    /**
     * The value.
     */
    abstract value: string;

    /**
     * Message from `setCustomValidity()`, combined with intrinsic constraints
     * into a single `setValidity()` call
     */
    _customValidityMessage = '';

    /**
     * The element the validation bubble anchors to. Defaults to the `<input>`;
     * override when the editable element isn't an `<input>`, e.g. textarea
     * `undefined` (not `null`) when absent - `setValidity`'s anchor is a
     * non-nullable `HTMLElement`
     *
     * @protected
     */
    get _validityAnchor(): HTMLElement | undefined {
      return (this as unknown as { _input?: HTMLElement })._input ?? undefined;
    }

    /**
     * Sync to `ElementInternals.setValidity()` so native
     * validation (`:invalid`, submission gating, `reportValidity()`) tracks the
     * component without explicit `checkValidity()`. `required` and empty maps
     * to `valueMissing`; `setCustomValidity()` adds `customError`
     *
     * @protected
     */
    _refreshInternalsValidity() {
      const internals = (this as unknown as { _internals?: ElementInternals })
        ._internals;
      if (!internals || typeof internals.setValidity !== 'function') {
        return;
      }

      const anchor = this._validityAnchor;
      const status = this._testValidity();
      const flags: ValidityStateFlags = {};
      let message = '';

      if (status === VALIDATION_STATUS.ERROR_REQUIRED) {
        flags.valueMissing = true;
        message = this.requiredValidityMessage;
      }

      if (this._customValidityMessage) {
        flags.customError = true;
        message = this._customValidityMessage;
      }

      // throw if flags are set without message
      if (Object.keys(flags).length === 0) {
        internals.setValidity({});
      } else {
        internals.setValidity(flags, message, anchor);
      }
    }

    /**
     * Refresh native validity on every render. Does not dispatch `invalid`
     * or change the visual `invalid` state (those stay with `checkValidity()`)
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update(changedProperties: any) {
      // @ts-expect-error - `update` exists on the Lit base class
      super.update(changedProperties);
      this._refreshInternalsValidity();
    }

    /**
     * Checks if the value meets the constraints.
     * Fires cancelable `invalid` event if it doesn't.
     *
     * @returns `true` if the value meets the constraints. `false` otherwise.
     */
    checkValidity() {
      const status = this._testValidity();
      if (status !== VALIDATION_STATUS.NO_ERROR) {
        if (
          this.dispatchEvent(
            new CustomEvent('invalid', {
              bubbles: false,
              cancelable: true,
              composed: false,
            })
          )
        ) {
          this.invalid = true;
          this.validityMessage = this._getValidityMessage(status) as string;
        }
        this._refreshInternalsValidity();
        return false;
      }
      this.invalid = false;
      this.validityMessage = '';
      this._refreshInternalsValidity();
      return true;
    }

    /**
     * Checks validity and surface native validation UI
     *
     * @returns `true` if value meets constraints
     */
    reportValidity() {
      this._refreshInternalsValidity();
      const internals = (this as unknown as { _internals?: ElementInternals })
        ._internals;
      if (internals && typeof internals.reportValidity === 'function') {
        return internals.reportValidity();
      }
      return this.checkValidity();
    }

    /**
     * Sets the given custom validity message.
     *
     * @param validityMessage The custom validity message
     */
    setCustomValidity(validityMessage: string) {
      this._customValidityMessage = validityMessage;
      this.invalid = Boolean(validityMessage);
      this.validityMessage = validityMessage;
      this._refreshInternalsValidity();
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return ValidityMixinImpl as any;
};

export default ValidityMixin;
