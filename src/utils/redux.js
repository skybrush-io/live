/**
 * @file Redux-related utility functions.
 */

import pMinDelay from 'p-min-delay';
import { createAction } from '@reduxjs/toolkit';

/**
 * Creates an action factory with an async preparation function.
 *
 * The preparation function will be called with all the arguments that were
 * originallz passed to the action factory. It must then return a promise, which
 * will be dispatched to Redux with the given action name. The Redux middleware
 * will take care of dispatching appropriate actions that notify the store about
 * the progress of the execution of the promise.
 *
 * @param {string} name     the name of the action to dispatch
 * @param {func}   prepare  the async function that the action will execute and
 *        whose promise will be dispatched to Redux
 * @param {object} options  additional options to control the execution
 * @param {number} options.minDelay minimum delay between the start and the end
 *        of the execution of the promise. Used to get rid of annoying UI
 *        glitches when it would not be desired to show a progress indicator
 *        for a very short-lived action.
 */
export function createAsyncAction(name, prepare, options = {}) {
  const { minDelay } = options;
  let func = prepare;

  if (minDelay && minDelay > 0) {
    func = (...args) => pMinDelay(prepare(...args), minDelay);
  }

  return createAction(name, (...args) => ({ payload: func(...args) }));
}

export function noPayload(func) {
  return {
    prepare: () => ({}),
    reducer: func,
  };
}

/**
 * Frozen empty array that can be returned from selectors to prevent
 * recomputations in some cases.
 */
export const EMPTY_ARRAY = Object.freeze([]);

/**
 * Frozen empty object that can be returned from selectors to prevent
 * recomputations in some cases.
 */
export const EMPTY_OBJECT = Object.freeze({});
