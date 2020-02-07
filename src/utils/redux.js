/**
 * @file Redux-related utility functions.
 */

import { createAction } from '@reduxjs/toolkit';

/**
 * Creates an action factory with an async preparation function.
 */
export function createAsyncAction(name, prepare) {
  return createAction(name, (...args) => ({ payload: prepare(...args) }));
}

export function noPayload(func) {
  return {
    prepare: () => ({}),
    reducer: func
  };
}
