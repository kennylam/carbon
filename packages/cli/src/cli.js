// Copyright IBM Corp. 2019, 2023
//
// This source code is licensed under the Apache-2.0 license found in the
// LICENSE file in the root directory of this source tree.

import process from 'node:process';
import yargs from 'yargs';
import packageJson from '../package.json' with { type: 'json' };

const cli = yargs;

async function main({ argv }) {
  cli(process.argv.slice(2))
    .scriptName(packageJson.name)
    .version(packageJson.version)
    .usage('Usage: $0 [options]').argv;

  cli(process.argv.slice(2))
    .commandDir('commands', {
      visit(commandModule) {
        return commandModule.default;
      },
    })
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
    }).argv;
}

export default main;
