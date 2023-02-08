import config from 'config';

import has from 'lodash-es/has';
import pickBy from 'lodash-es/pickBy';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';

function initializeSession(reconciler) {
  return (...args) => {
    let result = reconciler(...args);

    if (
      typeof config.session.maxLengthInSeconds === 'number' &&
      config.session.maxLengthInSeconds > 0
    ) {
      result = {
        ...result,
        session: {
          ...result.session,
          expiresAt: Date.now() + config.session.maxLengthInSeconds * 1000,
        },
      };
    }

    return result;
  };
}

export const defaultStateReconciler = initializeSession(
  (inboundState, originalState, reducedState, ...rest) => {
    // Iterate over the top-level collections in the inboundState. If the
    // collections are defined, don't merge them with the collections in the
    // originalState as we don't want the example objects that we load into
    // the store by default to "come back" every time the state is rehydrated
    // at application startup.

    const isCollection = (stateSlice) => stateSlice && has(stateSlice, 'byId');
    const isSubslice = (stateSlice) =>
      stateSlice !== null &&
      typeof stateSlice === 'object' &&
      !Array.isArray(stateSlice);

    const cleanCollections = (inbound, original) => {
      const cleaned = pickBy(original, (_, key) => !isCollection(inbound[key]));

      for (const key of Object.keys(cleaned)) {
        if (isSubslice(cleaned[key]) && has(inbound, key)) {
          cleaned[key] = cleanCollections(inbound[key], cleaned[key]);
        }
      }

      return cleaned;
    };

    if (inboundState && typeof inboundState === 'object') {
      // Maybe we have a hack here: originalState is outright ignored and
      // we pass cleanedState both as original and as "reduced" state to
      // autoMergeLevel2(). It is unclear to me what the difference is between
      // the two states, and it does not work if I pass originalState instead
      // of cleanedState in the second argument.
      const cleanedState = cleanCollections(inboundState, reducedState);
      return autoMergeLevel2(inboundState, cleanedState, cleanedState, ...rest);
    }

    return autoMergeLevel2(inboundState, originalState, reducedState, ...rest);
  }
);

export const pristineReconciler = initializeSession(
  (inboundState, originalState, reducedState) => reducedState
);
