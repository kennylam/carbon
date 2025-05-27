/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { reporter } from '@carbon/cli-reporter';
import { exec } from 'child-process-promise';
import inquirer from 'inquirer';
import { workspace } from '../workspace.js';

export async function handler({ bump = 'patch' }, env) {
  reporter.info('Starting release process...');

  const options = {
    cwd: env.root.directory,
    stdio: 'inherit',
  };

  try {
    const { stdout: lernaListOutput } = await exec(
      'yarn lerna list --json',
      options
    );
    const packages = JSON.parse(lernaListOutput).filter((pkg) => !pkg.private);

    reporter.info('Packages to release:');
    for (const pkg of packages) {
      reporter.info(`  ${pkg.name}@${pkg.version}`);
    }

    const { shouldContinue } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldContinue',
        message: `Proceed with ${bump} release?`,
        default: false,
      },
    ]);

    if (!shouldContinue) {
      reporter.info('Aborting release');
      return;
    }

    await exec(
      `yarn lerna version ${bump} --no-push --no-git-tag-version --yes`,
      options
    );

    reporter.success('Release complete! 🎉');
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

export const command = 'release [bump]';
export const desc = 'run the release step for the given version bump';

export function builder(yargs) {
  yargs.positional('bump', {
    describe: 'The type of version bump (major, minor, patch)',
    type: 'string',
    default: 'patch',
  });
}
