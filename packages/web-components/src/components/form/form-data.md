# Form participation

This document describes how `@carbon/web-components` form controls participate
in HTML form submission and constraint validation.

## Current approach: form-associated custom elements

Form controls are
[form-associated custom elements](https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements)
(FACE) backed by
[`ElementInternals`](https://developer.mozilla.org/en-US/docs/Web/API/ElementInternals).
This is implemented by `FormAssociatedMixin`
(`src/globals/mixins/form-associated.ts`), which:

- Declares `static formAssociated = true` so the user agent associates the
  element with its ancestor `<form>`.
- Calls `attachInternals()` in the constructor and stores the result on
  `_internals`.
- Pushes the control's value into the form via `ElementInternals.setFormValue()`
  on every render. Components override `_getFormValue()` to express
  control-specific semantics (e.g. a checkbox only submits when checked, a
  slider submits a stringified number).
- Surfaces the native form/validity surface: `form`, `labels`, `validity`,
  `validationMessage`, `willValidate`, `checkValidity()`, `reportValidity()`.
- Implements the form lifecycle callbacks `formResetCallback`,
  `formDisabledCallback`, and `formStateRestoreCallback`.

Because the value is registered natively, the control is included automatically
whenever the form is submitted or read with `new FormData(form)` — no manual
`formdata` event handling is required.

> **Note:** FACE derives the submitted entry name from the element's `name` >
> _content attribute_. Components that participate in forms therefore reflect
> `name` to an attribute.

### Constraint validation

`ValidityMixin` (`src/globals/mixins/validity.ts`) mirrors the control's
constraints onto `ElementInternals.setValidity()` on every render (via
`_refreshInternalsValidity()`), so the native constraint-validation surface
(`validity`, `validationMessage`, `reportValidity()`, and submission gating)
stays in sync without requiring an explicit `checkValidity()` call. Intrinsic
constraints map to standard `ValidityStateFlags` — e.g. a `required` control
with an empty value reports `validity.valueMissing` and blocks native form
submission — while a message passed to `setCustomValidity()` is layered on top
as `customError`.

## Migration note: the legacy `formdata` stop-gap

Before FACE was broadly supported, these components participated in forms via a
stop-gap that listened for the `formdata` event on the containing `<form>` and
appended values to `event.formData` (`FormMixin`, `src/globals/mixins/form.ts`).

`FormMixin` is now **deprecated**. It remains exported and functional for
backward compatibility but should not be used for new work; use
`FormAssociatedMixin` instead. The two approaches are mutually exclusive for a
given control: combining them would double-count values during native
submission.
