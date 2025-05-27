/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { reporter } from '@carbon/cli-reporter';
import glob from 'fast-glob';
import { compile } from '../compile.js';

export async function handler({ ignore, pattern }) {
  reporter.info('Running Sass build check...');

  const files = glob.sync(pattern, {
    ignore: Array.isArray(ignore) ? ignore : [ignore],
  });

  if (files.length === 0) {
    reporter.info('No Sass files found...');
    return;
  }

  reporter.info(`Compiling ${files.length} files...`);

  try {
    compile(files);
  } catch (error) {
    if (error.formatted) {
      console.error(error.formatted);
      process.exit(1);
    }
    console.error(error);
    process.exit(1);
  }

  reporter.success('Done! ✨');
}

export const command = 'check [pattern]';
export const desc = 'check that each file can be compiled';

export function builder(yargs) {
  yargs.positional('pattern', {
    describe: 'Pattern to match files to check',
    type: 'string',
    default: '**/*.scss',
  });

  yargs.options({
    ignore: {
      describe: 'Provide a pattern of files to ignore',
      type: 'string',
      default: '**/node_modules/**',
    },
  });
}
