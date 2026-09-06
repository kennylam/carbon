/**
 * Copyright IBM Corp. 2016, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const os = require('os');
const path = require('path');

// Serve the a11y rule engine from the same static server that already hosts
// Storybook, rather than from the public CDN the checker defaults to
// (https://cdn.jsdelivr.net/npm/accessibility-checker-engine).
//
// `tasks/stage-ace-rules.mjs` copies the engine out of node_modules into
// <storybook-static>/rules during the AVT build, so the files are the exact
// ones yarn.lock already pins. Each worker process otherwise fetches
// archives.json, ace.js and ace-node.js from that CDN as it starts; they are
// memoised per process rather than per assertion, but they still sit on every
// shard's startup path, where a CDN blip fails the shard outright.
//
// Both keys are required. `ruleServer` is where archives.json is read from;
// `rulePack` is where ace.js and ace-node.js are read from. Left unset,
// rulePack is derived as `${ruleServer}@${version}`, a jsDelivr-shaped URL that
// a plain static server cannot serve.
//
// ACE_RULE_SERVER lets the AVT lab point this somewhere else without a commit.
const localRuleServer =
  process.env.ACE_RULE_SERVER ??
  (process.env.CI ? 'http://localhost:3000/rules' : undefined);

module.exports = {
  ...(localRuleServer
    ? { ruleServer: localRuleServer, rulePack: localRuleServer }
    : {}),
  // Resolved against archives.json by `findLatestArchiveId`, which picks the
  // newest archive at or below the installed accessibility-checker version.
  // yarn.lock pins that version, so this is already a reviewed, dated input.
  ruleArchive: 'versioned',
  policies: ['Custom_Ruleset'],
  failLevels: ['violation'],
  reportLevels: !process.env.CI
    ? ['violation']
    : [
        'violation',
        'potentialviolation',
        'recommendation',
        'potentialrecommendation',
        'manual',
      ],
  // don't share parallel workers
  cacheFolder: path.join(
    os.tmpdir(),
    process.env.JEST_WORKER_ID
      ? `accessibility-checker-${process.env.JEST_WORKER_ID}`
      : 'accessibility-checker'
  ),
  outputFormat: ['json'],
  outputFolder: path.join('.avt', 'reports'),
  baselineFolder: path.join('.avt', 'baseline'),
};
