/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { workspace } from '../workspace.js';
import * as npmTask from './sync/npm.js';
import * as packageTask from './sync/package.js';
import * as readmeTask from './sync/readme.js';

const tasks = {
  npm: npmTask,
  package: packageTask,
  readme: readmeTask,
};

export async function handler(args, env) {
  const { target } = args;
  const tasksToRun = target === 'all' ? Object.keys(tasks) : [target];

  for (const name of tasksToRun) {
    const task = tasks[name];
    await task.run(env);
  }
}

export const command = 'sync [target]';
export const desc = 'sync files across workspaces';
