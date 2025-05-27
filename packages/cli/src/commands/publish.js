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

export async function handler({ tag = 'latest' }, env) {
  reporter.info('Publishing packages...');

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

    const { stdout: npmViewOutput } = await exec(
      `npm view ${packages.map((pkg) => pkg.name).join(' ')} version --json`,
      options
    );
    const registryVersions = JSON.parse(npmViewOutput);

    const packagesToPublish = packages.filter((pkg) => {
      const registryVersion = registryVersions[pkg.name];
      return registryVersion !== pkg.version;
    });

    if (packagesToPublish.length === 0) {
      reporter.info('No packages to publish');
      return;
    }

    reporter.info('Packages to publish:');
    for (const pkg of packagesToPublish) {
      const registryVersion = registryVersions[pkg.name];
      reporter.info(
        `  ${pkg.name}@${pkg.version} (${
          registryVersion ? `current: ${registryVersion}` : 'new package'
        })`
      );
    }

    const { shouldPublish } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'shouldPublish',
        message: 'Proceed with publishing these packages?',
        default: false,
      },
    ]);

    if (!shouldPublish) {
      reporter.info('Aborting publish');
      return;
    }

    await exec(
      `yarn lerna publish from-package --dist-tag ${tag} --yes`,
      options
    );
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

export const command = 'publish [tag]';
export const desc =
  'publish packages that have different versions from the package registry';

export function builder(yargs) {
  yargs.positional('tag', {
    describe: 'dist-tag to use when publishing',
    type: 'string',
    default: 'latest',
  });
}
