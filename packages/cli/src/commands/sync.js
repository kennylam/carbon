/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { workspace } from '../workspace';

import npmTask from './sync/npm';
import packageTask from './sync/package';
import readmeTask from './sync/readme';

const tasks = {
  npm: npmTask,
  package: packageTask,
  readme: readmeTask,
};

async function sync(args, env) {
  const { target } = args;
  const tasksToRun = target === 'all' ? Object.keys(tasks) : [target];

  for (const name of tasksToRun) {
    const task = tasks[name];
    await task.run(env);
  }
}

export default {
  command: 'sync [target]',
  desc: 'sync files across workspaces',
  builder(yargs) {
    yargs.positional('target', {
      describe: 'choose a target to sync',
      choices: ['all', 'npm', 'package', 'readme'],
      default: 'all',
    });
  },
  handler: workspace(sync),
};
