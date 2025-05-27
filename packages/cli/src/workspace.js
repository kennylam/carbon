/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { fileURLToPath } from 'url';
import { dirname, parse, join, relative } from 'path';
import fse from 'fs-extra';
import glob from 'fast-glob';
import execa from 'execa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const { root: ROOT_DIR } = parse(__dirname);
const WORKSPACE_ROOT = getProjectRoot(__dirname);
const packageJson = fse.readJsonSync(join(WORKSPACE_ROOT, 'package.json'));
const packagePaths = Array.isArray(packageJson.workspaces)
  ? glob
      .sync(
        packageJson.workspaces.map((pattern) => `${pattern}/package.json`),
        {
          cwd: WORKSPACE_ROOT,
        }
      )
      .map((match) => {
        const packageJsonPath = join(WORKSPACE_ROOT, match);
        return {
          packageJsonPath,
          packageJson: fse.readJsonSync(packageJsonPath),
          packagePath: dirname(packageJsonPath),
          packageFolder: relative(WORKSPACE_ROOT, dirname(packageJsonPath)),
        };
      })
  : [];

const env = {
  root: {
    directory: WORKSPACE_ROOT,
    packageJson,
  },
  packagePaths,
};

export function workspace(fn) {
  return (...args) => fn(...args, env);
}

/**
 * Lists the packages for the current project using the `lerna list` command
 * @returns {Array<PackageInfo>}
 */
export async function getPackages() {
  const { stdout: lernaListOutput } = await execa('yarn', [
    'lerna',
    'list',
    '--json',
  ]);
  return JSON.parse(lernaListOutput).filter((pkg) => !pkg.private);
}

/**
 * Returns the root directory of a project, either as a workspace root with a
 * collection of packages or a single project with a `package.json`
 * @param {string} directory
 * @returns {string}
 */
function getProjectRoot(directory) {
  const packageJsonPaths = ancestors(directory).filter((directory) => {
    return fse.existsSync(join(directory, 'package.json'));
  });

  const rootDirectory =
    packageJsonPaths.length > 0
      ? packageJsonPaths[packageJsonPaths.length - 1]
      : null;

  if (!rootDirectory) {
    throw new Error(
      `Unable to find a \`package.json\` file from directory: ${directory}`
    );
  }

  return rootDirectory;
}

/**
 * Returns an array of the the directory and its ancestors
 * @param {string} directory
 * @returns {Array<string>}
 */
function ancestors(directory) {
  const result = [directory];
  let current = directory;

  while (current !== '') {
    result.push(current);

    if (current !== ROOT_DIR) {
      current = dirname(current);
    } else {
      current = '';
    }
  }

  return result;
}
