/**
 * Copyright IBM Corp. 2016, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { expect } = require('@playwright/test');

async function visitStory(page, options) {
  const { component, story, id, globals, args } = options;
  let url = getStoryUrl({
    component,
    story,
    id,
  });

  if (args) {
    const values = Object.entries(args)
      .map(([key, value]) => {
        return `${key}:${value}`;
      })
      .join(';');
    url = url + `&args=${values}`;
  }

  if (globals) {
    const values = Object.entries(globals)
      .map(([key, value]) => {
        return `${key}:${value}`;
      })
      .join(',');
    url = url + `&globals=${values}`;
  }

  await page.goto(url);
  await expect(page).toContainAStory(options);

  // Ensure Plex assets are fully available for accurate VRT.
  //
  // There are no *.vrt.e2e.js files in this repo -- visual regression is
  // Chromatic's job -- so on every AVT run this awaits font loading a few
  // hundred times to support assertions that do not exist. Gated rather than
  // deleted so it comes back for free if Playwright VRT is reintroduced;
  // `playwright.config.js` still lists a vrt testMatch pattern.
  if (process.env.AVT_WAIT_FOR_FONTS === 'true') {
    await page.evaluate(async () => {
      await document.fonts.ready;
    });
  }
}

function getStoryUrl({ component, story, id }) {
  const normalized = id ? id : `components-${component}--${story}`;

  // Note: We serve a static storybook in CI that will trim .html extensions
  // from the URL
  if (process.env.CI) {
    return `/iframe?id=${normalized}&viewMode=story`;
  }
  return `/iframe.html?id=${normalized}&viewMode=story`;
}

module.exports = {
  visitStory,
};
