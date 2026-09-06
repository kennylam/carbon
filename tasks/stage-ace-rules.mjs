/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Stage the IBM accessibility-checker rule engine into the Storybook static
 * directory so AVT reaches no public network host at test time.
 *
 * By default `accessibility-checker` pulls three files from a public CDN
 * (`https://cdn.jsdelivr.net/npm/accessibility-checker-engine`) as each
 * Playwright worker process starts:
 *
 *   archives.json   the rule-archive index, read to resolve `ruleArchive`
 *   ace.js          the browser engine, eval'd into the page under test
 *   ace-node.js     the Node engine, written to the cache folder and required
 *
 * Those are not per-assertion fetches -- the checker memoises all three per
 * process -- but they sit on the critical path of every shard's startup, so a
 * CDN blip fails the shard rather than slowing it.
 *
 * The engine is already a locked, installed dependency
 * (`accessibility-checker-engine`, pinned by yarn.lock to the same version as
 * `accessibility-checker` itself), and the npm package root has exactly the
 * layout the checker expects to fetch. So this is a copy, not a download:
 * nothing is versioned here that yarn.lock does not already pin, and there is
 * no separate archive to re-pin when the dependency is bumped.
 *
 * Pair with the `ruleServer` / `rulePack` overrides in achecker.js, which point
 * the checker at the same static server that already hosts Storybook.
 *
 * Usage:
 *   node tasks/stage-ace-rules.mjs --out packages/react/storybook-static/rules
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

// The three files `ACConfigManager` and `ACEngineManager` request, all of which
// live at the root of the engine package.
const FILES = ['archives.json', 'ace.js', 'ace-node.js'];

const args = process.argv.slice(2);
const outArg = args.indexOf('--out');
const OUT = path.resolve(
  ROOT,
  outArg !== -1 ? args[outArg + 1] : 'packages/react/storybook-static/rules'
);

async function main() {
  // Resolve through the package rather than hardcoding node_modules, so this
  // works the same under hoisting, workspaces and pnp.
  let enginePkg;
  try {
    enginePkg = path.dirname(
      require.resolve('accessibility-checker-engine/package.json')
    );
  } catch {
    throw new Error(
      'Cannot resolve `accessibility-checker-engine`. It is a dependency of ' +
        '`accessibility-checker`; run `yarn install` first.'
    );
  }

  const { version } = require('accessibility-checker-engine/package.json');

  // `accessibility-checker` does not expose ./package.json through its
  // "exports", so read it off disk as a sibling of the engine package. This is
  // only used for the sanity check below, so a miss is not fatal.
  let toolVersion = null;
  try {
    toolVersion = JSON.parse(
      await fs.readFile(
        path.join(enginePkg, '..', 'accessibility-checker', 'package.json'),
        'utf8'
      )
    ).version;
  } catch {
    // Not hoisted alongside; skip the check.
  }

  // A mismatch here means `ruleArchive: 'versioned'` resolves against an
  // archive list that does not contain the engine we are serving. Warn loudly
  // rather than fail -- the checker picks the newest archive at or below the
  // tool version, so a newer engine is survivable, just not what CI intends.
  if (toolVersion && version !== toolVersion) {
    console.warn(
      `[stage-ace-rules] WARNING: accessibility-checker-engine@${version} does ` +
        `not match accessibility-checker@${toolVersion}. 'versioned' resolves ` +
        `against the tool version, so these should normally be equal.`
    );
  }

  await fs.mkdir(OUT, { recursive: true });

  for (const file of FILES) {
    const from = path.join(enginePkg, file);
    let bytes;
    try {
      bytes = await fs.readFile(from);
    } catch {
      throw new Error(
        `Expected ${file} at ${from}. The engine package layout has changed; ` +
          `achecker.js's ruleServer/rulePack overrides need revisiting.`
      );
    }
    await fs.writeFile(path.join(OUT, file), bytes);
    console.log(
      `[stage-ace-rules]   ${file} — ${(bytes.length / 1024).toFixed(0)} KB`
    );
  }

  console.log(
    `[stage-ace-rules] engine ${version} -> ${path.relative(ROOT, OUT)}`
  );
}

main().catch((error) => {
  console.error(`[stage-ace-rules] FAILED: ${error.message}`);
  process.exit(1);
});
