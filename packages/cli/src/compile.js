/**
 * Copyright IBM Corp. 2018, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import sass from 'sass';

const defaultOptions = {
  includePaths: ['node_modules', '../../node_modules'],
};

export function compile(filepaths, options) {
  return filepaths.map((file) => {
    return sass.renderSync({
      file,
      ...defaultOptions,
      ...options,
    });
  });
}
