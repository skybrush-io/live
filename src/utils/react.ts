/**
 * @file React-related utility functions.
 */

import type { ForwardedRef, RefCallback } from 'react';

export const multiRef =
  <T>(refs: Array<ForwardedRef<T>>): RefCallback<T> =>
  (value: T): void => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(value);
      } else if (typeof ref === 'object' && ref !== null) {
        ref.current = value;
      }
    }
  };
