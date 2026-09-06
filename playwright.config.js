/**
 * Copyright IBM Corp. 2016, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { devices, expect } = require('@playwright/test');
const path = require('path');

const config = {
  // https://playwright.dev/docs/api/class-testconfig#test-config-test-dir
  testDir: path.join(__dirname, 'e2e'),

  // https://playwright.dev/docs/api/class-testconfig#test-config-test-ignore
  testIgnore: [
    path.join(__dirname, 'e2e', 'icons'),
    path.join(__dirname, 'e2e', 'icons-react'),
    path.join(__dirname, 'e2e', 'icons-vue'),
    path.join(__dirname, 'e2e', 'pictograms'),
    path.join(__dirname, 'e2e', 'pictograms-react'),
  ],

  // https://playwright.dev/docs/api/class-testconfig#test-config-test-match
  testMatch: /.*-test(.avt|.vrt)?.e2e\.m?js$/,

  // https://playwright.dev/docs/api/class-testconfig#test-config-timeout
  //
  // Was 300s per test with a 100s expect timeout. At those values a single
  // broken assertion costs 100s, and with retries: 2 a broken test occupies a
  // worker for up to 15 minutes before its shard reports -- which is most of
  // the gap between the ~4 minutes of actual test work per shard and the ~22
  // minutes observed. Raise individual cases with test.setTimeout() instead.
  timeout: 30_000,

  // https://playwright.dev/docs/test-timeouts
  expect: { timeout: 10_000 },

  // Run tests within a file in parallel, not just files against each other.
  // Without this the 28 tests in DataTable-test.avt.e2e.js run serially in one
  // worker, which is the largest source of shard imbalance.
  fullyParallel: true,

  // https://playwright.dev/docs/api/class-testconfig#test-config-output-dir
  outputDir: path.join(__dirname, '.playwright', 'results'),
  snapshotDir: path.join(__dirname, '.playwright', 'snapshots'),

  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? '100%' : undefined,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Determinism knobs. Animations in flight during an a11y scan change what
    // the checker sees; a fixed viewport removes runner-dependent layout.
    contextOptions: { reducedMotion: 'reduce' },
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    // Desktop
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  reporter: [
    // Dot reporter is used in CI because it's very concise - it only produces a
    // single character per successful test run.
    [process.env.CI ? 'dot' : 'line'],

    // The remaining reporters should always be used, in both CI and dev.
    ['blob'],
    [
      'json',
      {
        outputFile: path.join(__dirname, '.playwright', 'results.json'),
      },
    ],
    [
      'json',
      {
        outputFile: path.join(
          __dirname,
          'packages/react/.playwright',
          'INTERNAL_AVT_REPORT_DO_NOT_USE.json'
        ),
      },
    ],
  ],
};

let aChecker;

expect.extend({
  async toHaveNoACViolations(page, id) {
    if (!aChecker) {
      aChecker = require('accessibility-checker');
      const denylist = new Set([
        'html_lang_exists',
        'page_title_exists',
        'skip_main_exists',
        'html_skipnav_exists',
        'aria_content_in_landmark',
        'aria_child_tabbable',
      ]);

      const ruleset = await aChecker.getRuleset('IBM_Accessibility');
      const customRuleset = JSON.parse(JSON.stringify(ruleset));

      customRuleset.id = 'Custom_Ruleset';
      customRuleset.checkpoints = customRuleset.checkpoints.map(
        (checkpoint) => {
          checkpoint.rules = checkpoint.rules.filter((rule) => {
            return !denylist.has(rule.id);
          });
          return checkpoint;
        }
      );

      aChecker.addRuleset(customRuleset);
    }

    const result = await aChecker.getCompliance(page, id);
    if (aChecker.assertCompliance(result.report) === 0) {
      return {
        pass: true,
      };
    } else {
      return {
        pass: false,
        message: () => aChecker.stringifyResults(result.report),
      };
    }
  },
});

expect.extend({
  async toContainAStory(page, options) {
    let pass;
    try {
      /**
       * This isn't a foolproof way to determine that an actual story
       * has been rendered, but it should determine if a storybook
       * error page is present or not.
       */
      await expect(page.locator('css=.cds--layout')).toBeAttached();
      pass = true;
    } catch (e) {
      pass = false;
    }

    if (pass) {
      return {
        pass: true,
      };
    } else {
      return {
        pass: false,
        message:
          () => `An element with the "cds--layout" class was not found at url:
          ${page.url()}

          The url is probably invalid and does not render a story.
          Check the url locally, and verify the parameters passed to visitStory are correct.

          component: ${options.component} 
          story: ${options.story} 
          id: ${options.id} 
          globals: ${JSON.stringify(options.globals)} 
          args: ${JSON.stringify(options.args)}`,
      };
    }
  },
});

module.exports = config;
