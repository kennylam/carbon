/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import fs from 'fs-extra';
import path from 'path';
import prettier from 'prettier2';
import prettierConfig from 'prettier-config-carbon';
import createRemark from 'remark';
import monorepo from './remark/remark-monorepo';

const packageDenyList = new Set([
  'carbon-components',
  'carbon-components-react',
  '@carbon/react',
  '@carbon/styles',
]);

export const run = async ({ root, packagePaths }) => {
  const remark = createRemark().use(monorepo, {
    root: root.directory,
  });
  const prettierOptions = {
    ...prettierConfig,
    parser: 'markdown',
  };

  await Promise.all(
    packagePaths
      .filter((pkg) => !packageDenyList.has(pkg.packageJson.name))
      .map(async ({ packagePath }) => {
        const README_PATH = path.join(packagePath, 'README.md');
        if (!(await fs.pathExists(README_PATH))) {
          return;
        }

        const readme = await fs.readFile(README_PATH, 'utf8');
        const file = await process(remark, packagePath, readme);
        await fs.writeFile(
          README_PATH,
          prettier.format(String(file), prettierOptions)
        );
      })
  );
};

const process = (remark, cwd, contents) => {
  return new Promise((resolve, reject) => {
    remark.process({ cwd, contents }, (error, file) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(file);
    });
  });
};

export default {
  name: 'readme',
  run,
};
