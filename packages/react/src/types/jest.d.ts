/**
 * Copyright IBM Corp. 2023, 2025
 *
 * This source code is licensed under the Apache-2.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

// Type declarations for Jest matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveNoACViolations(label?: string): Promise<R>;
      toHaveNoAxeViolations(options?: any): Promise<R>;
    }
  }
}

export {};
