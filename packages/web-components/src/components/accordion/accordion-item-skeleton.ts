/**
 * Copyright IBM Corp. 2019, 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LitElement, html } from 'lit';
import { ScopedElementsMixin } from '@open-wc/scoped-elements/lit-element.js';
import { customElement } from 'lit/decorators.js';
import ChevronRight16 from '@carbon/icons/lib/chevron--right/16.js';
import { prefix } from '../../globals/settings';
import '../skeleton-text/index';
import styles from './accordion.scss?lit';
import CDSSkeletonText from '../skeleton-text/skeleton-text';

/**
 * Skeleton of accordion item.
 */
@customElement(`${prefix}-accordion-item-skeleton`)
class CDSAccordionItemSkeleton extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'cds-skeleton-text': CDSSkeletonText,
    };
  }

  render() {
    return html`
      <span class="${prefix}--accordion__heading">
        ${ChevronRight16({
          part: 'expando-icon',
          class: `${prefix}--accordion__arrow`,
        })}
        <cds-skeleton-text
          class="${prefix}--accordion__title"></cds-skeleton-text>
      </span>
    `;
  }

  static styles = styles;
}

export default CDSAccordionItemSkeleton;
