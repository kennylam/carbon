/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs-extra';
import path from 'path';

export function formatGlobals(globals) {
  if (typeof globals !== 'string') {
    return {};
  }

  return globals.split(',').reduce((acc, entry) => {
    const [key, value] = entry.split('=');
    return {
      ...acc,
      [key]: value,
    };
  }, {});
}

export function formatDependenciesIntoGlobals(dependencies) {
  return Object.keys(dependencies).reduce((acc, key) => {
    return {
      ...acc,
      [key]: key,
    };
  }, {});
}

export async function findPackageFolder(entrypoint) {
  const directory = path.dirname(entrypoint);
  const packageJsonPaths = ancestors(directory).filter((directory) => {
    return fs.existsSync(path.join(directory, 'package.json'));
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

function ancestors(directory) {
  const result = [directory];
  let current = directory;

  while (current !== '') {
    result.push(current);

    if (current !== '/') {
      current = path.dirname(current);
    } else {
      current = '';
    }
  }

  return result;
}
