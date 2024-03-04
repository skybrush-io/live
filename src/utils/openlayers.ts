import constant from 'lodash-es/constant';
import type Collection from 'ol/Collection';

/**
 * Propagates changes from one OpenLayers collection to another one.
 * If a predicate is provided, the forwarded elements are filtered.
 */
export const forwardCollectionChanges = <T>(
  source: Collection<T>,
  target: Collection<T>,
  predicate: (element: T) => boolean = constant(true)
): void => {
  target.extend(source.getArray().filter(predicate));

  source.on('add', (e) => {
    if (predicate(e.element)) {
      target.push(e.element);
    }
  });
  source.on('remove', (e) => {
    if (predicate(e.element)) {
      target.remove(e.element);
    }
  });
};
