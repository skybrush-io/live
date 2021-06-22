import mapValues from 'lodash-es/mapValues';
import watch from 'redux-watch';

/**
 * Given an object that maps keys to selectors, returns an object that maps
 * the same keys to _functions_ that allow one to subscribe to the changes
 * of the values of these selectors. The return values of these functions can
 * be called directly to unsubscribe.
 */
export const bindSelectors = (selectors, store) =>
  mapValues(
    selectors,
    (selector) => (func) =>
      store.subscribe(watch(() => selector(store.getState()))(func))
  );
