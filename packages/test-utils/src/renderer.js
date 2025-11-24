/**
 * Copyright IBM Corp. 2016, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

const fs = require('fs');
const sass = require('sass');
const path = require('path');

const SassRenderer = {
  create(cwd, initialData = '') {
    const nodeModules = getNodeModulesFolders(cwd);

    async function render(data) {
      const values = [];
      const valuesByKey = new Map();
      const result = sass.compileString(`${initialData}\n${data}`, {
        functions: {
          'get-value($arg)': (args) => {
            values.push(args[0]);
            return sass.sassNull;
          },
          'get($key, $value)': (args) => {
            const key = args[0];
            const value = args[1];
            valuesByKey.set(convert(key), {
              value: convert(value),
              nativeValue: value,
            });
            return sass.sassNull;
          },
        },
        loadPaths: [cwd, ...nodeModules],
        quietDeps: true,
      });

      return {
        result: {
          css: Buffer.from(result.css),
        },
        values,
        getValue(index) {
          return convert(values[index]);
        },
        get(key) {
          if (valuesByKey.has(key)) {
            return valuesByKey.get(key);
          }
          throw new Error(`Unabled to find value with key: ${key}`);
        },
        unwrap(key) {
          if (valuesByKey.has(key)) {
            return valuesByKey.get(key).value;
          }
          throw new Error(`Unabled to find value with key: ${key}`);
        },
      };
    }

    return {
      convert,
      render,
      types: sass.types,
    };
  },
};

/**
 * Converts a value from Sass into a comparable JavaScript type
 */
function convert(value) {
  const { types } = sass;

  if (value instanceof types.Boolean) {
    return value.getValue();
  }

  if (value instanceof types.Number) {
    const unit = value.getUnit();
    if (unit === '') {
      return value.getValue();
    }
    return `${value.getValue()}${unit}`;
  }

  if (value instanceof types.String) {
    return value.getValue();
  }

  if (value instanceof types.Color) {
    return value.dartValue.toString();
  }

  if (value instanceof types.List) {
    const length = value.getLength();
    const result = Array(length);

    for (let i = 0; i < length; i++) {
      result[i] = convert(value.getValue(i));
    }

    return result;
  }

  if (value instanceof types.Map) {
    const length = value.getLength();
    const result = {};

    for (let i = 0; i < length; i++) {
      const key = convert(value.getKey(i));
      result[key] = convert(value.getValue(i));
    }

    return result;
  }

  if (value instanceof types.Null) {
    return null;
  }

  return value;
}

/**
 * Collect all the node_modules folders that are present in the current path by
 * traversing upwards and looking for if a node_modules folder exists. This is
 * useful for the `includePaths` option for a sass renderer
 * @param {string} cwd
 * @returns {Array<string>}
 */
function getNodeModulesFolders(cwd) {
  const { root } = path.parse(cwd);
  const folders = [];
  let directory = cwd;

  while (directory !== root) {
    const folder = path.join(directory, 'node_modules');
    if (fs.existsSync(folder)) {
      folders.push(folder);
    }
    directory = path.dirname(directory);
  }

  return folders;
}

module.exports = {
  SassRenderer,
};
