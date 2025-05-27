/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { reporter } from '@carbon/cli-reporter';
import { exec } from 'child-process-promise';
import { workspace } from '../workspace.js';

export async function handler(args, env) {
  reporter.info('Building changelog...');

  const options = {
    cwd: env.root.directory,
    stdio: 'inherit',
  };

  try {
    await exec('yarn lerna-changelog', options);
  } catch (error) {
    if (error.stdout) {
      console.error(error.stdout);
    }
    if (error.stderr) {
      console.error(error.stderr);
    }
    console.error(error);
    process.exit(1);
  }
}

export const command = 'changelog';
export const desc = 'build the changelog using lerna-changelog';
