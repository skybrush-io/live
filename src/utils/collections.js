import curry from 'lodash-es/curry';
import isNil from 'lodash-es/isNil';
import isPlainObject from 'lodash-es/isPlainObject';
import reject from 'lodash-es/reject';
import u from 'updeep';

import { chooseUniqueIdFromName } from './naming';

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
const hasValidId = item =>
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
 * Helper function that receives an item to be added to a collection, and
 * adds it to the front of the collection.
 *
 * The item should already have an assigned `id` property. If there is no such
 * property, or it is equal to the special "new item" value, a new ID will be
 * generated based on the `name` property of the item. If there is no `name`
 * property either, an error will be thrown.
 *
 * If an item with the generated ID already exists in the collection, it will
 * be moved to the front of the collection.
 *
 * @param  {Object}   collection  the ordered collection to add the item to
 * @param  {Object}   item  the item to add
 */
export const addToFront = (collection, item) => {
  const isNew = item && item.id === NEW_ITEM_ID;

  item = { ...item };

  if (!hasValidId(item)) {
    if (item.name === undefined) {
      throw new Error('New item needs either an ID or a name');
    }

    item.id = chooseUniqueIdFromName(item.name, collection);
  }

  const { order } = collection;
  const existingIndex = order ? order.indexOf(item.id) : -1;

  if (existingIndex >= 0) {
    collection.order.splice(existingIndex, 1);
  }

  collection.byId[item.id] = item;
  collection.order.splice(0, 0, item.id);

  if (isNew) {
    delete collection.byId[NEW_ITEM_ID];
  }
};

/**
 * Helper function that removes all items from an ordered collection.
 */
export const clearOrderedCollection = collection => {
  collection.byId = {};
  collection.order = [];
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
export const createNewItemAtFrontOf = (collection, idStore) => {
  const id = NEW_ITEM_ID;
  storeId(idStore, id);
  collection.byId[id] = { id };
};

/**
 * Helper function that receives an item ID and an ordered collection,
 * and returns another ordered collection that is equal to the original
 * one, except that the item with the given ID is removed.
 *
 * @param  {string}  idToRemove  the item ID to remove
 * @param  {Object}  collection  the ordered collection to modify
 * @return {Object}  the collection with the given item removed
 */
export const deleteById = (idToRemove, collection) => {
  const updates = {
    byId: u.omit(idToRemove),
    order: u.reject(id => id === idToRemove)
  };
  return u(updates, collection);
};

/**
 * Helper function that receives multiple item IDs and an ordered collection,
 * and returns another ordered collection that is equal to the original
 * one, except that the items with the given IDs are removed.
 *
 * @param  {string[]}  idsToRemove  the item IDs to remove
 * @param  {Object}    collection  the ordered collection to modify
 * @return {Object}    the collection with the given items removed
 */
export const deleteByIds = (idsToRemove, collection) => {
  if (idsToRemove.length === 1) {
    return deleteById(idsToRemove[0], collection);
  }

  const updates = {
    byId: u.omit(idsToRemove),
    order: u.reject(id => idsToRemove.includes(id))
  };
  return u(updates, collection);
};

/**
 * Creates a key string that can be used in a call to <code>u.updateIn</code>
 * to update some properties of an item in an ordered collection.
 *
 * @param  {string}  itemId  the ID of the item
 * @param  {...string?} subKeys optional sub-keys that will be appended to the
 *         returned key if you want to update some deeply nested property
 *         of the selected item
 * @return {string}  an updeep key that corresponds to the item with the
 *         given ID
 */
export const getKey = (itemId, ...subKeys) => {
  if (itemId.includes('.')) {
    throw new Error('Item ID cannot contain dots');
  }

  const subKey = subKeys.join('.');
  return subKey ? `byId.${itemId}.${subKey}` : `byId.${itemId}`;
};

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
    : reject(order.map(id => byId[id]), isNil);

/**
 * Helper function that takes an array of item IDs and an ordered collection,
 * and returns _another_ ordered collection with the ``order`` replaced by the
 * given item IDs.
 *
 * @param  {Object}  collection  the ordered collection to reorder
 * @param  {string}  newOrder    the new order of items
 * @return {Object}  the reordered collection
 */
export const reorder = (collection, newOrder) =>
  u({ order: newOrder }, collection);

/**
 * Helper function that takes a single item with a key named `id`, and an
 * ordered collection, and merges the item into the collection based on its
 * ID.
 *
 * If the incoming object has no ID yet, it will be added to the front of
 * the collection as a new item.
 *
 * @param  {Object}  item  the item to update in the collection
 * @param  {Object}  collection  the ordered collection to update
 * @return {Object}  the updated collection
 */
export const updateOrAdd = (collection, item) => {
  if (hasValidId(item)) {
    collection.byId[item.id] = { ...item };
  } else {
    addToFront(collection, item);
  }
};
