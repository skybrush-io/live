import has from 'lodash-es/has';
import isNil from 'lodash-es/isNil';
import isPlainObject from 'lodash-es/isPlainObject';
import property from 'lodash-es/property';
import pull from 'lodash-es/pull';
import sortedIndex from 'lodash-es/sortedIndex';
import sortedIndexBy from 'lodash-es/sortedIndexBy';
import reject from 'lodash-es/reject';
import { orderBy } from 'natural-orderby';

import { chooseUniqueIdFromName } from './naming';
import { EMPTY_ARRAY } from './redux';

/**
 * Helper functions to deal with ordered collections.
 *
 * Ordered collections are objects with two keys: ``byId`` and ``order``,
 * where ``order`` is an array of string identifiers that define the
 * order of items in the collection, and ``byId`` is a mapping from
 * string identifiers to the corresponding objects.
 *
 * A special string identifier exists for an item that is currently being
 * added to the collection and has not been finalized yet by the user. There
 * can be at most one such item in a collection at any given time.
 */

/**
 * Special value to mark a newly added item in collections. Newly added items
 * are not supposed to appear in the collection itself; they act as temporary
 * placeholders until they are finalized (saved) by the user, in which case they
 * obtain a "real" ID and a place in the collection.
 */
export const NEW_ITEM_ID = '@@newItem';

/**
 * Returns whether the given item has a "real" ID.
 *
 * A "real" ID is one that is not an empty string and not the special "new item"
 * constant.
 *
 * @param {Object}  item  the item to test
 * @return {boolean}  whether the item has a real ID
 */
const hasValidId = (item) =>
  item &&
  item.id !== undefined &&
  item.id !== null &&
  item.id !== '' &&
  item.id !== NEW_ITEM_ID;

const storeId = (idStore, id) => {
  if (typeof idStore === 'function') {
    idStore(id);
  } else if (isPlainObject(idStore)) {
    idStore.id = id;
  }
};

/**
 * Custom error class that is thrown when we try to add an item to a collection
 * and another item with the same ID already exists.
 */
class ItemExistsError extends Error {
  constructor(id, message = 'An item with the same ID already exists') {
    super(message);
    this.name = 'ItemExistsError';
    this.id = id;
  }
}

/**
 * Ensures that the given item has an ID property.
 *
 * If the item has no ID property yet, but it has a name instead, an ID will
 * be generated from the name and it will be assigned to the item in-place.
 *
 * If the item has no ID property yet, and it has no name either, an exception
 * will be thrown.
 *
 * @param  collection  the collection that the item will be a part of
 * @param  item  the item that needs a unique ID in the collection
 */
const ensureItemHasValidId = (collection, item) => {
  if (!hasValidId(item)) {
    if (item.name === undefined) {
      throw new Error('New item needs either an ID or a name');
    }

    item.id = chooseUniqueIdFromName(item.name, Object.keys(collection.byId));
  } else if (has(collection.byId, item.id)) {
    throw new ItemExistsError(item.id);
  }
};

/**
 * Helper function that receives an item to be added to a collection, and
 * adds it to the collection at the given index.
 *
 * When the index is negative or zero, the item will be added at the front.
 *
 * When the item is larger than or equal to the length of the collection, the
 * item will be added at the back.
 *
 * The item should already have an assigned `id` property. If there is no such
 * property, or it is equal to the special "new item" value, a new ID will be
 * generated based on the `name` property of the item. If there is no `name`
 * property either, an error will be thrown.
 *
 * If an item with the generated ID already exists in the collection, an error
 * will be thrown.
 *
 * @param  {Object}   collection  the ordered collection to add the item to
 * @param  {Object}   item   the item to add
 * @param  {number}   index  the index to add the given item at
 */
export const addItemAt = (collection, item, index) => {
  const isNew = item && item.id === NEW_ITEM_ID;

  item = { ...item };
  ensureItemHasValidId(collection, item);

  collection.byId[item.id] = item;

  if (index < 0) {
    collection.order.splice(0, 0, item.id);
  } else if (index >= collection.order.length) {
    collection.order.push(item.id);
  } else {
    collection.order.splice(index, 0, item.id);
  }

  if (isNew) {
    delete collection.byId[NEW_ITEM_ID];
  }
};

/**
 * Helper function that receives an item to be added to a collection, and
 * adds it to the collection at the given index, unless an item with the
 * same ID already exists, in which case this function is a no-op.
 *
 * When the index is negative or zero, the item will be added at the front.
 *
 * When the item is larger than or equal to the length of the collection, the
 * item will be added at the back.
 *
 * The item should already have an assigned `id` property. If there is no such
 * property, or it is equal to the special "new item" value, a new ID will be
 * generated based on the `name` property of the item. If there is no `name`
 * property either, an error will be thrown.
 *
 * @param  {Object}   collection  the ordered collection to add the item to
 * @param  {Object}   item   the item to add
 * @param  {number}   index  the index to add the given item at
 */
export const addItemUnlessExistsAt = (collection, item, index) => {
  try {
    return addItemAt(collection, item, index);
  } catch (error) {
    if (error instanceof ItemExistsError) {
      /* this is okay */
    }
  }
};

/**
 * Returns the index where a given item should be inserted in a collection to
 * keep the collection sorted by the given key.
 *
 * @param  {Object}   collection  the ordered collection to add the item to
 * @param  {Object}   item  the item to add
 * @param  {function|string} key   a function that can be called with a
 *         single item and that returns a value that is used to compare items,
 *         or the name of a single property that is used as a sorting key
 * @return {number}   the insertion index
 */
function getInsertionIndexForSortedCollection(collection, item, key = 'id') {
  if (key === 'id') {
    /* shortcut for the common case */
    return sortedIndex(collection.order, item.id);
  }

  const getter = typeof key === 'string' ? property(key) : key;
  return sortedIndexBy(collection.order, item.id, (id) => {
    const existingItem = collection.byId[id];
    return existingItem === undefined ? getter(item) : getter(existingItem);
  });
}

/**
 * Helper function that receives an item to be added to a collection, and
 * adds it to the collection based on a sorting key function.
 *
 * It is assumed that the collection is already sorted based on the sorting
 * key function.
 *
 * The item should already have an assigned `id` property. If there is no such
 * property, or it is equal to the special "new item" value, a new ID will be
 * generated based on the `name` property of the item. If there is no `name`
 * property either, an error will be thrown.
 *
 * If an item with the generated ID already exists in the collection, an error
 * will be thrown.
 *
 * @param  {Object}   collection  the ordered collection to add the item to
 * @param  {Object}   item  the item to add
 * @param  {function|string} key   a function that can be called with a
 *         single item and that returns a value that is used to compare items,
 *         or the name of a single property that is used as a sorting key
 */
export const addItemSorted = (collection, item, key = 'id') => {
  const index = getInsertionIndexForSortedCollection(collection, item, key);
  return addItemAt(collection, item, index);
};

/**
 * Helper function that receives an item to be added to a collection, and
 * adds it to the collection based on a sorting key function, unless an item
 * is already in the collection, in which case this function is a no-op.
 *
 * It is assumed that the collection is already sorted based on the sorting
 * key function.
 *
 * The item should already have an assigned `id` property. If there is no such
 * property, or it is equal to the special "new item" value, a new ID will be
 * generated based on the `name` property of the item. If there is no `name`
 * property either, an error will be thrown.
 *
 * @param  {Object}   collection  the ordered collection to add the item to
 * @param  {Object}   item  the item to add
 * @param  {function|string} key   a function that can be called with a
 *         single item and that returns a value that is used to compare items,
 *         or the name of a single property that is used as a sorting key
 */
export const addItemSortedUnlessExists = (collection, item, key = 'id') => {
  const index = getInsertionIndexForSortedCollection(collection, item, key);
  return addItemUnlessExistsAt(collection, item, index);
};

/**
 * Helper function that receives an item to be added to a collection, and
 * adds it to the back of the collection.
 *
 * The item should already have an assigned `id` property. If there is no such
 * property, or it is equal to the special "new item" value, a new ID will be
 * generated based on the `name` property of the item. If there is no `name`
 * property either, an error will be thrown.
 *
 * If an item with the generated ID already exists in the collection, an error
 * will be thrown.
 *
 * @param  {Object}   collection  the ordered collection to add the item to
 * @param  {Object}   item  the item to add
 */
export const addItemToBack = (collection, item) =>
  addItemAt(collection, item, collection.order.length);

/**
 * Helper function that receives an item to be added to a collection, and
 * adds it to the front of the collection.
 *
 * The item should already have an assigned `id` property. If there is no such
 * property, or it is equal to the special "new item" value, a new ID will be
 * generated based on the `name` property of the item. If there is no `name`
 * property either, an error will be thrown.
 *
 * If an item with the generated ID already exists in the collection, an error
 * will be thrown.
 *
 * @param  {Object}   collection  the ordered collection to add the item to
 * @param  {Object}   item  the item to add
 */
export const addItemToFront = (collection, item) =>
  addItemAt(collection, item, 0);

/**
 * Helper function that removes all items from an ordered collection.
 */
export const clearOrderedCollection = (collection) => {
  collection.byId = {};
  collection.order = [];
};

/**
 * Creates a collection out of an array of items and a function that retrieves
 * the ID from each item.
 */
export const createCollectionFromArray = (items, key = 'id') => {
  let index = 0;
  const result = {
    byId: {},
    order: [],
  };

  const getter = typeof key === 'string' ? property(key) : key;

  for (const item of items) {
    const id = getter(item);

    if (isNil(id)) {
      throw new Error(`Item at index ${index} has no key`);
    }

    if (result.byId[id] !== undefined) {
      throw new Error(`Duplicate key: ${id}`);
    }

    result.byId[id] = item;
    result.order.push(id);

    index++;
  }

  return result;
};

/**
 * Creates a new item at the front of the given collection that can then
 * subsequently be edited by the user before it is finalized in the
 * collection.
 *
 * @param  {Object}   collection  the ordered collection to add the item to
 * @param  {function|Object?}  idStore  when it is a function, it will be called
 *         with the ID of the newly generated item. When it is a plain object,
 *         the ID of the newly generated item will be associated to its `id`
 *         property. Otherwise it is ignored.
 * @return {Object}  a copy of the collection after initiating the creation of
 *         the new item
 */
export const createNewItemInFrontOf = (collection, idStore) => {
  const id = NEW_ITEM_ID;
  storeId(idStore, id);
  collection.byId[id] = { id };
};

/**
 * Helper function that receives an item ID and an ordered collection,
 * and removes the item with the given ID from the ordered collection.
 *
 * @param  {Object}  collection  the ordered collection to modify
 * @param  {string}  idToRemove  the item ID to remove
 */
export const deleteItemById = (collection, idToRemove) => {
  delete collection.byId[idToRemove];
  pull(collection.order, idToRemove);
};

/**
 * Helper function that receives multiple item IDs and an ordered collection,
 * removes the items with the given IDs from the ordered collection.
 *
 * @param  {Object}    collection  the ordered collection to modify
 * @param  {string[]}  idsToRemove  the item IDs to remove
 */
export const deleteItemsByIds = (collection, idsToRemove) => {
  for (const id of idsToRemove) {
    delete collection.byId[id];
  }

  pull(collection.order, ...idsToRemove);
};

/**
 * Helper function that receives multiple item IDs and an ordered collection,
 * removes the items with the given IDs from the ordered collection.
 *
 * This function anticipates the case that none of the IDs are actually in the
 * collection, so it first iterates over the IDs and checks whether any of the
 * IDs are in the collection. If it finds no match, it returns without touching
 * the collection.
 *
 * @param  {Object}    collection  the ordered collection to modify
 * @param  {string[]}  idsToRemove  the item IDs to remove
 */
export const maybeDeleteItemsByIds = (collection, idsToRemove) => {
  for (const id of idsToRemove) {
    if (collection.byId[id] !== undefined) {
      return deleteItemsByIds(collection, idsToRemove);
    }
  }
};

/**
 * Helper function that takes an ordered collection and returns the first item
 * in the collection, or undefined if the collection is empty.
 */
export const selectFirst = ({ byId, order }) =>
  order === undefined || order.length === 0 ? undefined : byId[0];

/**
 * Helper function that takes an ordered collection and returns the last item
 * in the collection, or undefined if the collection is empty.
 */
export const selectLast = ({ byId, order }) =>
  order === undefined || order.length === 0
    ? undefined
    : byId[order.length - 1];

/**
 * Helper function that takes an ordered collection and converts it into an
 * array that contains the items according to the order of keys in the
 * `order` part of the ordered collection.
 *
 * @return {Object[]} an array of values from the `byId` part of the ordered
 *     collection, filtered and sorted according to the `order` array
 */
export const selectOrdered = ({ byId, order }) =>
  order === undefined
    ? Object.values(byId)
    : order.length === 0
    ? EMPTY_ARRAY
    : reject(
        order.map((id) => byId[id]),
        isNil
      );

/**
 * Helper function that takes an array of item IDs and an ordered collection,
 * and returns _another_ ordered collection with the ``order`` replaced by the
 * given item IDs.
 *
 * @param  {Object}  collection  the ordered collection to reorder
 * @param  {string}  newOrder    the new order of items
 * @return {Object}  the reordered collection
 */
export const reorder = (collection, newOrder) => ({
  ...structuredClone(collection),
  order: newOrder,
});

/**
 * Helper function that takes a single item and an ordered collection, and
 * attempts to replace the item in the collection based on its ID.
 *
 * If the incoming object has no ID yet, or has an ID but is not in the
 * collection, it will be added to the collection in a way that maintains
 * sortedness according to the given key.
 *
 * @param  {Object}  item  the item to replace in the collection
 * @param  {Object}  collection  the ordered collection to update
 * @param  {function|string} key   a function that can be called with a
 *         single item and that returns a value that is used to compare items,
 *         or the name of a single property that is used as a sorting key
 */
export const replaceItemOrAddSorted = (collection, item, key = 'id') => {
  if (hasValidId(item) && collection.byId[item.id]) {
    collection.byId[item.id] = { ...item };
  } else {
    addItemSorted(collection, item, key);
  }
};

/**
 * Helper function that takes a single item and an ordered collection, and
 * attempts to replace the item in the collection based on its ID.
 *
 * If the incoming object has a valid ID, it is assumed that it is already
 * in the collection, but its representation will be replaced.
 *
 * If the incoming object has no ID yet, it will be added to the front of
 * the collection as a new item.
 *
 * @param  {Object}  item  the item to replace in the collection
 * @param  {Object}  collection  the ordered collection to update
 */
export const replaceItemOrAddToFront = (collection, item) => {
  if (hasValidId(item) && collection.byId[item.id]) {
    collection.byId[item.id] = { ...item };
  } else {
    addItemToFront(collection, item);
  }
};

/**
 * Helper function that takes an ordered collection and ensures that the items
 * in the collection are sorted using natural sort based on their IDs.
 */
export const ensureNaturalSortOrder = (collection) => {
  collection.order = orderBy(collection.order);
};
