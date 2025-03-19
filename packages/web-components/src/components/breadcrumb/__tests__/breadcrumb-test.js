/**
 * @license
 *
 * Copyright IBM Corp. 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { expect, fixture, html, triggerFocusFor } from '@open-wc/testing';
import { sendKeys } from '@web/test-runner-commands';
import '@carbon/web-components/es/components/breadcrumb/index.js';

const breadcrumbItems = html`<cds-breadcrumb-item>
    <cds-breadcrumb-link href="/#">Breadcrumb A</cds-breadcrumb-link>
  </cds-breadcrumb-item>
  <cds-breadcrumb-item>
    <cds-breadcrumb-link href="#">Breadcrumb B</cds-breadcrumb-link>
  </cds-breadcrumb-item>
  <cds-breadcrumb-item>
    <cds-breadcrumb-link href="#">Breadcrumb C</cds-breadcrumb-link>
  </cds-breadcrumb-item>`;

describe('cds-breadcrumb', function () {
  it('should render', async () => {
    const el = await fixture(
      html`<cds-breadcrumb>${breadcrumbItems}</cds-breadcrumb>`
    );

    expect(el).dom.to.equalSnapshot();
  });

  it('should accept a `aria-label` for nav element', async () => {
    const el = await fixture(
      html`<cds-breadcrumb aria-label="test-label">
        ${breadcrumbItems}
      </cds-breadcrumb>`
    );

    expect(el.getAttribute('aria-label', 'test-label'));
  });
});
