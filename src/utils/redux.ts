/**
 * @file Redux-related utility functions.
 */

import pMinDelay from 'p-min-delay';
import {
  createAction,
  type ActionCreatorWithPreparedPayload,
  type CaseReducerWithPrepare,
  type Draft,
  type PayloadAction,
} from '@reduxjs/toolkit';

/**
 * Creates an action factory with an async preparation function.
 *
 * The preparation function will be called with all the arguments that were
 * originally passed to the action factory. It must then return a promise, which
 * will be dispatched to Redux with the given action name. The Redux middleware
 * will take care of dispatching appropriate actions that notify the store about
 * the progress of the execution of the promise.
 *
 * @param name - The name of the action to dispatch
 * @param prepare - The async function that the action will execute and
 *                  whose promise will be dispatched to Redux
 * @param minDelay - Minimum delay between the start and the end of the
 *                   execution of the promise. Used to get rid of annoying UI
 *                   glitches when it would not be desired to show a progress
 *                   indicator for a very short-lived action
 */
export function createAsyncAction<PrepareArguments extends unknown[], Payload>(
  name: string,
  prepare: (...args: PrepareArguments) => PromiseLike<Payload>,
  { minDelay }: { minDelay?: number } = {}
): ActionCreatorWithPreparedPayload<PrepareArguments, PromiseLike<Payload>> {
  let func = prepare;

  if (minDelay && minDelay > 0) {
    func = (...args: PrepareArguments): PromiseLike<Payload> =>
      pMinDelay(prepare(...args), minDelay);
  }

  // NOTE: Redux Toolkit doesn't have precise enough typing, so currently
  // the spread arguments to `PrepareAction` always have the type `any[]`.
  // (@reduxjs/toolkit@dd4b36a4/packages/toolkit/src/createAction.ts#L41)
  return createAction(name, (...args: any[]) => ({
    payload: func(...(args as PrepareArguments)),
  }));
}

export function noPayload<State, Action extends PayloadAction>(
  func: (state: Draft<State>) => void
): CaseReducerWithPrepare<State, Action> {
  return {
    prepare: () => ({ payload: undefined }),
    reducer: func,
  };
}

/**
 * Frozen empty array that can be returned from selectors to prevent
 * recomputations in some cases.
 */
export const EMPTY_ARRAY: Readonly<never[]> = Object.freeze([]);

/**
 * Frozen empty object that can be returned from selectors to prevent
 * recomputations in some cases.
 */
export const EMPTY_OBJECT: Readonly<Record<never, never>> = Object.freeze({});
