import has from 'lodash-es/has';
import isNil from 'lodash-es/isNil';
import isObject from 'lodash-es/isObject';
import property, { type PropertyPath } from 'lodash-es/property';
import pull from 'lodash-es/pull';
import sortedIndex from 'lodash-es/sortedIndex';
import sortedIndexBy from 'lodash-es/sortedIndexBy';
import { orderBy } from 'natural-orderby';
import { type ReadonlyDeep } from 'type-fest';

import { chooseUniqueIdFromName } from './naming';
import { EMPTY_ARRAY, EMPTY_OBJECT } from './redux';

export type Identifier = string;
export type ItemLike = { id: Identifier };
export type Collection<T extends ItemLike> = {
  byId: Record<Identifier, T>;
  order: Identifier[];
};

export const EMPTY_COLLECTION: ReadonlyDeep<Collection<never>> = Object.freeze({
  byId: EMPTY_OBJECT,
  order: EMPTY_ARRAY,
});

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
export const NEW_ITEM_ID: Identifier = '@@newItem';

/**
 * Returns whether the given item has a "real" ID.
 *
 * A "real" ID is one that is not an empty string and not the special "new item"
 * constant.
 *
 * @param item - The item to test
 * @returns Whether the item has a real ID
 */
const hasValidId = <T extends ItemLike>(item?: T): boolean =>
  item?.id !== undefined &&
  item.id !== null &&
  item.id !== '' &&
  item.id !== NEW_ITEM_ID;

/**
 * Custom error class that is thrown when we try to add an item to a collection
 * and another item with the same ID already exists.
 */
class ItemExistsError extends Error {
  id: Identifier;

  constructor(
    id: Identifier,
    message = 'An item with the same ID already exists'
  ) {
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
 * @param collection - The collection that the item will be a part of
 * @param item - The item that needs a unique ID in the collection
 */
const ensureItemHasValidId = <T extends ItemLike>(
  collection: Collection<T>,
  item: T
): void => {
  if (!hasValidId(item)) {
    if (!('name' in item) || typeof item.name !== 'string') {
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
 * @param collection - The ordered collection to add the item to
 * @param item - The item to add
 * @param index - The index to add the given item at
 */
export const addItemAt = <T extends ItemLike>(
  collection: Collection<T>,
  item: T,
  index: number
): void => {
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
 * @param collection - The ordered collection to add the item to
 * @param item - The item to add
 * @param index - The index to add the given item at
 */
export const addItemUnlessExistsAt = <T extends ItemLike>(
  collection: Collection<T>,
  item: T,
  index: number
): void => {
  try {
    addItemAt(collection, item, index);
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
 * @param collection - The ordered collection to add the item to
 * @param item - The item to add
 * @param key - A function that can be called with a single item and that
 *              returns a value that is used to compare items, or the name of a
 *              single property that is used as a sorting key
 * @returns The insertion index
 */
function getInsertionIndexForSortedCollection<T extends ItemLike>(
  collection: Collection<T>,
  item: T,
  key: ((item: T) => Identifier) | PropertyPath = 'id'
): number {
  if (key === 'id') {
    /* shortcut for the common case */
    return sortedIndex(collection.order, item.id);
  }

  const getter: (item: T) => Identifier =
    typeof key === 'function' ? key : property(key);
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
 * @param collection - The ordered collection to add the item to
 * @param item - The item to add
 * @param key - A function that can be called with a single item and that
 *              returns a value that is used to compare items, or the name of a
 *              single property that is used as a sorting key
 */
export const addItemSorted = <T extends ItemLike>(
  collection: Collection<T>,
  item: T,
  key: ((item: T) => Identifier) | PropertyPath = 'id'
): void => {
  const index = getInsertionIndexForSortedCollection(collection, item, key);
  addItemAt(collection, item, index);
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
 * @param collection - The ordered collection to add the item to
 * @param item - The item to add
 * @param key - A function that can be called with a single item and that
 *              returns a value that is used to compare items, or the name of a
 *              single property that is used as a sorting key
 */
export const addItemSortedUnlessExists = <T extends ItemLike>(
  collection: Collection<T>,
  item: T,
  key: ((item: T) => Identifier) | PropertyPath = 'id'
): void => {
  const index = getInsertionIndexForSortedCollection(collection, item, key);
  addItemUnlessExistsAt(collection, item, index);
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
 * @param collection - The ordered collection to add the item to
 * @param item - The item to add
 */
export const addItemToBack = <T extends ItemLike>(
  collection: Collection<T>,
  item: T
): void => {
  addItemAt(collection, item, collection.order.length);
};

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
 * @param collection - The ordered collection to add the item to
 * @param item - The item to add
 */
export const addItemToFront = <T extends ItemLike>(
  collection: Collection<T>,
  item: T
): void => {
  addItemAt(collection, item, 0);
};

/**
 * Helper function that removes all items from an ordered collection.
 */
export const clearOrderedCollection = <T extends ItemLike>(
  collection: Collection<T>
): void => {
  collection.byId = {};
  collection.order = [];
};

/**
 * Creates a collection out of an array of items and a function that retrieves
 * the ID from each item.
 */
export const createCollectionFromArray = <T extends ItemLike>(
  items: T[],
  key: ((item: T) => Identifier) | PropertyPath = 'id'
): Collection<T> => {
  let index = 0;
  const result: Collection<T> = { byId: {}, order: [] };

  const getter: (item: T) => Identifier =
    typeof key === 'function' ? key : property(key);

  for (const item of items) {
    const id: Identifier = getter(item);

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
 * @param collection - The ordered collection to add the item to
 * @param idStore - When it is a function, it will be called with the ID of
 *                  the newly generated item. When it is an object, the ID of
 *                  the newly generated item will be associated to its `id`
 *                  property. Otherwise it is ignored.
 */
export const createNewItemInFrontOf = <T extends ItemLike>(
  collection: Collection<T>,
  idStore?: ((id: Identifier) => void) | Record<string, unknown>
): void => {
  const id = NEW_ITEM_ID;

  if (typeof idStore === 'function') {
    idStore(id);
  } else if (isObject(idStore)) {
    idStore['id'] = id;
  }

  collection.byId[id] = { id } as T;
};

/**
 * Helper function that receives an item ID and an ordered collection,
 * and removes the item with the given ID from the ordered collection.
 *
 * @param collection - The ordered collection to modify
 * @param idToRemove - The item ID to remove
 */
export const deleteItemById = <T extends ItemLike>(
  collection: Collection<T>,
  idToRemove: Identifier
): void => {
  delete collection.byId[idToRemove];
  pull(collection.order, idToRemove);
};

/**
 * Helper function that receives multiple item IDs and an ordered collection,
 * removes the items with the given IDs from the ordered collection.
 *
 * @param collection - The ordered collection to modify
 * @param idsToRemove - The item IDs to remove
 */
export const deleteItemsByIds = <T extends ItemLike>(
  collection: Collection<T>,
  idsToRemove: Identifier[]
): void => {
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
 * @param collection - The ordered collection to modify
 * @param idsToRemove - The item IDs to remove
 */
export const maybeDeleteItemsByIds = <T extends ItemLike>(
  collection: Collection<T>,
  idsToRemove: Identifier[]
): void => {
  for (const id of idsToRemove) {
    if (collection.byId[id] !== undefined) {
      deleteItemsByIds(collection, idsToRemove);
    }
  }
};

/**
 * Helper function that takes an ordered collection and returns the first item
 * in the collection, or undefined if the collection is empty.
 */
export const selectFirst = <T extends ItemLike>({
  byId,
  order,
}: Collection<T>): T | undefined =>
  order === undefined || order.length === 0 ? undefined : byId[0];

/**
 * Helper function that takes an ordered collection and returns the last item
 * in the collection, or undefined if the collection is empty.
 */
export const selectLast = <T extends ItemLike>({
  byId,
  order,
}: Collection<T>): T | undefined =>
  order === undefined || order.length === 0
    ? undefined
    : byId[order.length - 1];

/**
 * Helper function that takes an ordered collection and converts it into an
 * array that contains the items according to the order of keys in the
 * `order` part of the ordered collection.
 *
 * @returns An array of values from the `byId` part of the ordered collection,
 *          filtered and sorted according to the `order` array
 */
export const selectOrdered = <T extends ItemLike>({
  byId,
  order,
}: Collection<T>): readonly T[] =>
  order === undefined
    ? Object.values(byId)
    : order.length === 0
    ? EMPTY_ARRAY
    : order.map((id) => byId[id]).filter((t?: T): t is T => !isNil(t));

/**
 * Helper function that takes an array of item IDs and an ordered collection,
 * and returns _another_ ordered collection with the ``order`` replaced by the
 * given item IDs.
 *
 * @param collection - The ordered collection to reorder
 * @param newOrder - The new order of items
 * @returns The reordered collection
 */
export const reorder = <T extends ItemLike>(
  collection: Collection<T>,
  newOrder: Identifier[]
): Collection<T> => ({
  ...collection,
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
 * @param item - The item to replace in the collection
 * @param collection - The ordered collection to update
 * @param key - A function that can be called with a single item and that
 *              returns a value that is used to compare items, or the name of a
 *              single property that is used as a sorting key
 */
export const replaceItemOrAddSorted = <T extends ItemLike>(
  collection: Collection<T>,
  item: T,
  key: ((item: T) => Identifier) | PropertyPath = 'id'
): void => {
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
 * @param item - The item to replace in the collection
 * @param collection - The ordered collection to update
 */
export const replaceItemOrAddToFront = <T extends ItemLike>(
  collection: Collection<T>,
  item: T
): void => {
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
export const ensureNaturalSortOrder = <T extends ItemLike>(
  collection: Collection<T>
): void => {
  collection.order = orderBy(collection.order);
};
