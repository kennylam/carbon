/**
 * Copyright IBM Corp. 2019, 2024
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ScopedElementsMixin } from '../../globals/mixins/scoped-elements';
import { prefix } from '../../globals/settings';
import CDSSkeletonText, {
  SKELETON_TEXT_TYPE,
} from '../skeleton-text/skeleton-text';
import CDSButtonSkeleton from '../button/button-skeleton';

/**
 * The File uploader skeleton.
 *
 * @element cds-file-uploader-skeleton
 */
@customElement(`${prefix}-file-uploader-skeleton`)
class CDSFileUploaderSkeleton extends ScopedElementsMixin(LitElement) {
  static get scopedElements() {
    return {
      'cds-button-skeleton': CDSButtonSkeleton,
      'cds-skeleton-text': CDSSkeletonText,
    };
  }

  render() {
    return html`
      <cds-skeleton-text
        type="${SKELETON_TEXT_TYPE.HEADING}"
        width="100px"></cds-skeleton-text>
      <cds-skeleton-text width="225px"></cds-skeleton-text>
      <cds-button-skeleton></cds-button-skeleton>
    `;
  }
}

export default CDSFileUploaderSkeleton;
