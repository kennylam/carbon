/**
 * Copyright IBM Corp. 2018, 2023
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import javascript from './javascript.js';
import typescript from './typescript.js';

const bundlers = new Map([
  ['.js', javascript],
  ['.ts', typescript],
]);

export default bundlers;
