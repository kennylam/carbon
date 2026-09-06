/**
 * Copyright IBM Corp. 2026
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Summarise an avt-lab run into a GitHub step summary.
 *
 * Reads every `lab-results/*.json` produced by the matrix jobs and reports the
 * one number the lab exists to produce: what fraction of shard-jobs failed.
 * A single green CI run says nothing about flake; a failure rate across N
 * repeats does.
 *
 * Usage: node tasks/avt-lab-report.mjs <results-dir>
 * Env:   LABEL, CELLS (expected result count), GITHUB_STEP_SUMMARY
 */

import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2] ?? 'all-results/lab-results';
const label = process.env.LABEL ?? 'unlabelled';
const expected = Number(process.env.CELLS ?? 0);

const rows = fs.existsSync(dir)
  ? fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')))
      .sort((a, b) => a.repeat - b.repeat || a.shard - b.shard)
  : [];

const failed = rows.filter((r) => r.exitCode !== 0);
const durations = rows.map((r) => r.durationSeconds).sort((a, b) => a - b);
const sum = (key) => rows.reduce((n, r) => n + (r[key] ?? 0), 0);
const pct = (n, d) => (d ? `${((n / d) * 100).toFixed(1)}%` : 'n/a');
const mmss = (s) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`;
const code = (s) => '`' + s + '`';

const out = [];
out.push(`## Result — ${code(label)}`);
out.push('');
out.push(
  `**Shard-job failure rate: ${pct(failed.length, rows.length)}** ` +
    `(${failed.length} of ${rows.length} shard-jobs failed)`
);
if (expected && rows.length !== expected) {
  out.push('');
  out.push(
    `> Only ${rows.length} of ${expected} expected results reported — some jobs did not finish.`
  );
}
out.push('');
out.push(`- failed tests across all jobs: **${sum('failed')}**`);
out.push(`- flaky tests across all jobs: **${sum('flaky')}**`);
out.push(`- passed tests across all jobs: ${sum('passed')}`);
if (durations.length) {
  out.push(
    `- shard duration — min ${mmss(durations[0])}, ` +
      `median ${mmss(durations[durations.length >> 1])}, ` +
      `max ${mmss(durations[durations.length - 1])}`
  );
}
out.push('');
out.push('| repeat | shard | result | duration | passed | failed | flaky |');
out.push('| ---: | ---: | :--- | ---: | ---: | ---: | ---: |');
for (const r of rows) {
  out.push(
    `| ${r.repeat} | ${r.shard} | ${r.exitCode === 0 ? 'pass' : '**FAIL**'} ` +
      `| ${mmss(r.durationSeconds)} | ${r.passed} | ${r.failed} | ${r.flaky} |`
  );
}

const text = out.join('\n') + '\n';
console.log(text);
if (process.env.GITHUB_STEP_SUMMARY) {
  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, text);
}
