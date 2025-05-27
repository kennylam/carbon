/**
 * Copyright IBM Corp. 2019, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { reporter } from '@carbon/cli-reporter';
import { paramCase } from 'change-case-all';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';
import template from 'lodash.template';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_FOLDER = path.resolve(__dirname, '..', '..', 'templates');

export async function handler({ name }) {
  reporter.info('Creating component...');

  const { componentName } = name
    ? { componentName: name }
    : await inquirer.prompt([
        {
          type: 'input',
          name: 'componentName',
          message:
            'What is the name of the component you would like to create?',
          validate: (input) => {
            if (!input) {
              return 'Component name is required';
            }
            return true;
          },
        },
      ]);

  const packageName = paramCase(componentName);
  const packagePath = path.resolve(process.cwd(), packageName);

  if (await fs.pathExists(packagePath)) {
    reporter.error(`Directory ${packagePath} already exists`);
    process.exit(1);
  }

  await fs.ensureDir(packagePath);

  const templates = [
    {
      name: 'package.json',
      data: {
        name: packageName,
      },
    },
    {
      name: 'index.js',
      data: {
        name: componentName,
      },
    },
    {
      name: 'Component.js',
      data: {
        name: componentName,
      },
      rename: `${componentName}.js`,
    },
    {
      name: 'Component.stories.js',
      data: {
        name: componentName,
      },
      rename: `${componentName}.stories.js`,
    },
    {
      name: 'Component-test.js',
      data: {
        name: componentName,
      },
      rename: `${componentName}-test.js`,
    },
  ];

  await Promise.all(
    templates.map(async ({ name, data, rename = name }) => {
      const templatePath = path.join(TEMPLATES_FOLDER, 'component', name);
      const contents = await fs.readFile(templatePath, 'utf8');
      const compiled = template(contents)(data);
      await fs.writeFile(path.join(packagePath, rename), compiled);
    })
  );

  reporter.success(`Created component ${componentName} at ${packagePath}`);
}

export const command = 'component [name]';
export const desc = 'create a new component';

export function builder(yargs) {
  yargs.positional('name', {
    describe: 'Name of the component to create',
    type: 'string',
  });
}
