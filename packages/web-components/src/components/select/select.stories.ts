/**
 * Copyright IBM Corp. 2020, 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { html } from 'lit';
import { ifDefined } from 'lit/directives/if-defined.js';
// Below path will be there when an application installs `carbon-web-components` package.
// In our dev env, we auto-generate the file and re-map below path to to point to the generated file.
// @ts-ignore
import { prefix } from '../../globals/settings';
import { INPUT_SIZE } from '../text-input/text-input';
import View16 from '@carbon/icons/lib/view/16.js';
import FolderOpen16 from '@carbon/icons/lib/folder--open/16.js';
import Folders16 from '@carbon/icons/lib/folders/16.js';
import './index';
import '../form/form-item';
import '../layer';
import '../ai-label';
import '../icon-button';
import '../../../.storybook/templates/with-layer';
import styles from './select-story.scss?lit';

const content = html`
  <div slot="body-text">
    <p class="secondary">AI Explained</p>
    <h2 class="ai-label-heading">84%</h2>
    <p class="secondary bold">Confidence score</p>
    <p class="secondary">
      Lorem ipsum dolor sit amet, di os consectetur adipiscing elit, sed do
      eiusmod tempor incididunt ut fsil labore et dolore magna aliqua.
    </p>
    <hr />
    <p class="secondary">Model type</p>
    <p class="bold">Foundation model</p>
  </div>
`;

const actions = html`
  <cds-icon-button kind="ghost" slot="actions" size="lg">
    ${View16({ slot: 'icon' })}
    <span slot="tooltip-content"> View </span>
  </cds-icon-button>
  <cds-icon-button kind="ghost" slot="actions" size="lg">
    ${FolderOpen16({ slot: 'icon' })}
    <span slot="tooltip-content"> Open folder</span>
  </cds-icon-button>
  <cds-icon-button kind="ghost" slot="actions" size="lg">
    ${Folders16({ slot: 'icon' })}
    <span slot="tooltip-content"> Folders </span>
  </cds-icon-button>
  <cds-ai-label-action-button>View details</cds-ai-label-action-button>
`;

const sizes = {
  [`Small size (${INPUT_SIZE.SMALL})`]: INPUT_SIZE.SMALL,
  [`Medium size (${INPUT_SIZE.MEDIUM})`]: INPUT_SIZE.MEDIUM,
  [`Large size (${INPUT_SIZE.LARGE})`]: INPUT_SIZE.LARGE,
};

const args = {
  disabled: false,
  helperText: 'Optional helper text',
  hideLabel: false,
  inline: false,
  invalid: false,
  invalidText: 'Error message',
  labelText: 'Select an option',
  placeholder: '',
  size: INPUT_SIZE.MEDIUM,
  readOnly: false,
  warn: false,
  warnText: 'Warning message',
  value: '',
  children: html`
    <cds-select-item value=""></cds-select-item>
    <cds-select-item value="all"
      >An example option that is really long to show what should be done to
      handle long text</cds-select-item
    >
    <cds-select-item value="cloudFoundry">Option 2</cds-select-item>
    <cds-select-item value="staging">Option 3</cds-select-item>
    <cds-select-item value="dea">Option 4</cds-select-item>
  `,
};

const argTypes = {
  disabled: {
    control: 'boolean',
    description: 'Specify whether the control is disabled.',
  },
  helperText: {
    control: 'text',
    description:
      'Provide text that is used alongside the control label for additional help.',
  },
  hideLabel: {
    control: 'boolean',
    description: 'Specify whether the label should be hidden, or not.',
  },
  inline: {
    control: 'boolean',
    description: 'Specify whether you want the inline version of this control.',
  },
  invalid: {
    control: 'boolean',
    description: 'Specify if the currently value is invalid.',
  },
  invalidText: {
    control: 'text',
    description: 'Message which is displayed if the value is invalid.',
  },
  labelText: {
    control: 'text',
    description:
      'Provide label text to be read by screen readers when interacting with the control.',
  },
  placeholder: {
    control: 'text',
    description:
      'Placeholder text to be used with the <code>&lt;input&gt;</code>.',
  },
  size: {
    control: 'select',
    description: 'Specify the size of the Select Input.',
    options: sizes,
  },
  readOnly: {
    control: 'boolean',
    description: 'Whether the select should be read-only.',
  },
  warn: {
    control: 'boolean',
    description: 'Specify whether the control is currently in warning state.',
  },
  warnText: {
    control: 'text',
    description:
      'Provide the text that is displayed when the control is in warning state.',
  },
  value: {
    control: 'text',
    description: 'The value of the selected item.',
  },
  onInput: {
    action: `${prefix}-select-selected`,
  },
};

// const optionsEl = ;

export const Default = {
  args,
  argTypes,
  render: (args) => {
    const {
      disabled,
      helperText,
      hideLabel,
      inline,
      invalid,
      invalidText,
      labelText,
      name,
      placeholder,
      size,
      readOnly,
      warn,
      warnText,
      value,
      children,
      onInput,
    } = args ?? {};
    return html`
      <cds-form-item>
        <cds-select
          ?inline="${inline}"
          ?disabled="${disabled}"
          helper-text="${ifDefined(helperText)}"
          ?hide-label="${hideLabel}"
          ?invalid="${invalid}"
          invalid-text="${ifDefined(invalidText)}"
          label-text="${ifDefined(labelText)}"
          name="${ifDefined(name)}"
          placeholder="${ifDefined(placeholder)}"
          size="${ifDefined(size)}"
          ?readonly="${readOnly}"
          ?warn="${warn}"
          warn-text="${ifDefined(warnText)}"
          value="${ifDefined(value)}"
          @cds-select-selected="${ifDefined(onInput)}">
          ${children} helper-text="Optional helper text" label-text="Select an
          option">
          <cds-select-item
            value="An example option that is really long to show what should be done to handle long text"
            >An example option that is really long to show what should be done
            to handle long text</cds-select-item
          >
          <cds-select-item selected value="option-2">Option 2</cds-select-item>
          <cds-select-item value="option-3">Option 3</cds-select-item>
          <cds-select-item value="option-4">Option 4</cds-select-item>
        </cds-select>
      </cds-form-item>
    `;
  },
};

export const Inline = {
  args: {
    ...args,
    inline: true,
  },
  argTypes,
  render: (args) => {
    const {
      disabled,
      helperText,
      hideLabel,
      inline,
      invalid,
      invalidText,
      labelText,
      name,
      placeholder,
      size,
      readOnly,
      warn,
      warnText,
      value,
      children,
      onInput,
    } = args ?? {};
    return html`
      <cds-form-item>
        <cds-select
          ?inline="${inline}"
          ?disabled="${disabled}"
          helper-text="${ifDefined(helperText)}"
          ?hide-label="${hideLabel}"
          ?invalid="${invalid}"
          invalid-text="${ifDefined(invalidText)}"
          label-text="${ifDefined(labelText)}"
          name="${ifDefined(name)}"
          placeholder="${ifDefined(placeholder)}"
          size="${ifDefined(size)}"
          ?readonly="${readOnly}"
          ?warn="${warn}"
          warn-text="${ifDefined(warnText)}"
          value="${ifDefined(value)}"
          @cds-select-selected="${ifDefined(onInput)}">
          ${children}
        </cds-select>
      </cds-form-item>
    `;
  },
};

export const Skeleton = {
  parameters: {
    percy: {
      skip: true,
    },
  },
  render: () => html` <cds-select-skeleton></cds-select-skeleton> `,
};

export const WithAILabel = {
  args,
  argTypes: {
    ...argTypes,
    inline: {
      ...argTypes.inline,
      control: false,
    },
  },
  render: (args) => {
    const {
      disabled,
      helperText,
      hideLabel,
      invalid,
      invalidText,
      labelText,
      name,
      placeholder,
      size,
      readOnly,
      warn,
      warnText,
      value,
      children,
      onInput,
    } = args ?? {};

    return html` <div style="width: 400px">
      <cds-select
        ?inline="${false}"
        ?disabled="${disabled}"
        helper-text="${ifDefined(helperText)}"
        ?hide-label="${hideLabel}"
        ?invalid="${invalid}"
        invalid-text="${ifDefined(invalidText)}"
        label-text="${ifDefined(labelText)}"
        name="${ifDefined(name)}"
        placeholder="${ifDefined(placeholder)}"
        size="${ifDefined(size)}"
        ?readonly="${readOnly}"
        ?warn="${warn}"
        warn-text="${ifDefined(warnText)}"
        value="${ifDefined(value)}"
        @cds-select-selected="${ifDefined(onInput)}">
        <cds-ai-label alignment="bottom-left">
          ${content}${actions}</cds-ai-label
        >
        ${children}
      </cds-select>
    </div>`;
  },
};

export const WithLayer = {
  args,
  argTypes: {
    ...argTypes,
    inline: {
      ...argTypes.inline,
      control: false,
    },
  },
  render: (args) => {
    const {
      disabled,
      helperText,
      hideLabel,
      invalid,
      invalidText,
      labelText,
      name,
      placeholder,
      size,
      readOnly,
      warn,
      warnText,
      value,
      children,
      onInput,
    } = args ?? {};

    return html`
      <sb-template-layers>
        <cds-select
          ?inline="${false}"
          ?disabled="${disabled}"
          helper-text="${ifDefined(helperText)}"
          ?hide-label="${hideLabel}"
          ?invalid="${invalid}"
          invalid-text="${ifDefined(invalidText)}"
          label-text="${ifDefined(labelText)}"
          name="${ifDefined(name)}"
          placeholder="${ifDefined(placeholder)}"
          size="${ifDefined(size)}"
          ?readonly="${readOnly}"
          ?warn="${warn}"
          warn-text="${ifDefined(warnText)}"
          value="${ifDefined(value)}"
          @cds-select-selected="${ifDefined(onInput)}">
          ${children}
        </cds-select>
      </sb-template-layers>
    `;
  },
};

const meta = {
  decorators: [
    (story) => {
      return html`<div style="width: 400px">${story()}</div>`;
    },
  ],
  title: 'Components/Select',
};

export default meta;
