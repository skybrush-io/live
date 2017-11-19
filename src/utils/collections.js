import { curry, isNil, reject } from 'lodash'
import u from 'updeep'

/**
 * Helper functions to deal with ordered collections.
 *
 * Ordered collections are objects with two keys: ``byId`` and ``order``,
 * where ``order`` is an array of string identifiers that define the
 * order of items in the collection, and ``byId`` is a mapping from
 * string identifiers to the corresponding objects.
 */

/**
 * Helper function that receives an item ID and an ordered collection,
 * and returns another ordered collection that is equal to the original
 * one, except that the item with the given ID is removed.
 *
 * @param  {string}  idToRemove  the item ID to remove
 * @param  {object}  collection  the ordered collection to modify
 * @return {object}  the collection with the given item removed
 */
export const deleteById = curry((idToRemove, collection) => {
  const updates = {
    byId: u.omit(idToRemove),
    order: u.reject(id => id === idToRemove)
  }
  return u(updates, collection)
})

/**
 * Helper function that receives multiple item IDs and an ordered collection,
 * and returns another ordered collection that is equal to the original
 * one, except that the items with the given IDs are removed.
 *
 * @param  {string[]}  idsToRemove  the item IDs to remove
 * @param  {object}    collection  the ordered collection to modify
 * @return {object}    the collection with the given items removed
 */
export const deleteByIds = curry((idsToRemove, collection) => {
  if (idsToRemove.length === 1) {
    return deleteById(idsToRemove[0], collection)
  }
  
  const updates = {
    byId: u.omit(idsToRemove),
    order: u.reject(id => idsToRemove.includes(id))
  }
  return u(updates, collection)
})

/**
 * Helper function that takes an ordered collection and converts it into an
 * array that contains the items according to the order of keys in the
 * `order` part of the ordered collection.
 *
 * @return {Object[]} an array of values from the `byId` part of the ordered
 *     collection, filtered and sorted according to the `order` array
 */
export const selectOrdered = ({ byId, order }) => (
  (order !== undefined)
    ? reject(order.map(id => byId[id]), isNil)
    : Object.values(byId)
)

/**
 * Helper function that takes an array of item IDs and an ordered collection,
 * and returns another ordered collection with the ``order`` replaced by the
 * given item IDs.
 *
 * @param  {string}  newOrder    the new order of items
 * @param  {object}  collection  the ordered collection to reorder
 * @return {object}  the reordered collection
 */
export const reorder = curry((newOrder, collection) => ({
  byId: collection.byId,
  order: newOrder
}))
