/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs-extra';
import klaw from 'klaw-sync';
import os from 'os';
import path from 'path';
import replace from 'replace-in-file';
import { createLogger } from '../logger.js';

const logger = createLogger('inline');
const isWin = process.platform === 'win32';
const tmpDir = os.tmpdir();

export async function handler({ output }) {
  logger.start('inline');

  const cwd = process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');
  const sourceFolder = path.join(cwd, output);
  const inlineFolder = path.join(cwd, output, '_inlined');
  const vendorFolder = path.join(cwd, output, 'vendor');

  await Promise.all([fs.remove(inlineFolder), fs.remove(vendorFolder)]);

  logger.info('Inlining sass dependencies');

  await inlineSassDependencies(
    packageJsonPath,
    sourceFolder,
    vendorFolder,
    cwd
  );

  logger.stop();
}

async function inlineSassDependencies(
  packageJsonPath,
  sourceFolder,
  vendorFolder,
  cwd
) {
  if (!fs.existsSync(packageJsonPath)) {
    throw new Error(`Expected a package.json file at ${packageJsonPath}`);
  }

  const packageJson = await fs.readJson(packageJsonPath);
  const { dependencies = {}, devDependencies = {} } = packageJson;
  const allPossibleDependencies = [
    ...Object.keys(dependencies),
    ...Object.keys(devDependencies),
  ];
  const inlinedDependencies = (
    await Promise.all(
      allPossibleDependencies.map(async (dependency) => {
        const modules = findSassModule(dependency, cwd);
        if (modules) {
          const [scssFolder] = modules;
          const dependencyOutputFolder = path.join(vendorFolder, dependency);

          await fs.copy(scssFolder, dependencyOutputFolder);

          return [dependency, dependencyOutputFolder];
        }
      })
    )
  ).filter(Boolean);

  if (inlinedDependencies.length === 0) {
    return;
  }

  const tmpFolder = await fs.mkdtemp(
    path.join(tmpDir, 'carbon-bundler-inline-')
  );
  const inlineFolder = path.join(sourceFolder, '_inlined');
  const inlineFilename = path.join(
    sourceFolder,
    `${path.basename(path.dirname(sourceFolder))}.scss`
  );

  await fs.copy(sourceFolder, tmpFolder, {
    filter(src) {
      if (src === vendorFolder) {
        return false;
      }

      if (src === inlineFilename) {
        return false;
      }

      if (path.relative(sourceFolder, src).includes('modules')) {
        return false;
      }

      return path.basename(src) !== 'index.scss';
    },
  });
  await fs.copy(tmpFolder, inlineFolder);
  await fs.remove(tmpFolder);

  const paths = klaw(inlineFolder, {
    nodir: true,
  });

  const REPLACE_REGEX = new RegExp(
    `^@import '(${inlinedDependencies.map(([name]) => name).join('|')})/scss`,
    'gm'
  );

  await Promise.all(
    paths.map(async ({ path: filepath }) => {
      const options = {
        files: filepath,
        from: REPLACE_REGEX,
        to: (match) => {
          const [, pkg] = match.split("'");
          const relativePath = path.relative(
            path.dirname(filepath),
            path.join(vendorFolder, pkg, 'scss')
          );
          return `@import '${isWin ? relativePath.replace(/\\/g, '/') : relativePath}`;
        },
      };

      try {
        await replace(options);
      } catch (error) {
        console.log(error);
      }
    })
  );
}

function findSassModule(dependency, cwd) {
  const paths = [
    path.join(cwd, 'node_modules', dependency, 'scss'),
    path.join(cwd, '..', '..', 'node_modules', dependency, 'scss'),
  ];

  return paths.filter((scssFolder) => {
    return fs.existsSync(scssFolder);
  });
}

export const command = 'inline';
export const desc =
  'inline sass dependencies from package.json in a target folder';

export function builder(yargs) {
  yargs.options({
    o: {
      alias: 'output',
      describe: 'the directory to output inlined sass dependencies',
      type: 'string',
      default: 'scss',
    },
  });
}
