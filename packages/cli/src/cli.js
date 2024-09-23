/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// const cli = require('yargs');
// const packageJson = require('../package.json');

import check from './commands/ci-check.js';
import cli from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import packageJson from '../package.json' with { type: "json" };

export default async function main() {
  const argv = cli(hideBin(process.argv)).argv;

  cli(argv)
    .scriptName(packageJson.name)
    .version(packageJson.version)
    .usage('Usage: $0 [options]');

  cli(argv)
    .command(check())
    .strict()
    .fail((message, error, yargs) => {
      if (error) {
        if (error.stderr) {
          console.error(error.stderr);
          process.exit(1);
        }
        console.error(error);
        process.exit(1);
        return;
      }
      console.log(message);
      console.log(yargs.help());
      process.exit(1);
    })
    .parse.argv;
}

// module.exports = main;
