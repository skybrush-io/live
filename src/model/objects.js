/**
 * @file Functions and constants related to handling generic server-side
 * objects..
 */

import { notifyObjectsDeletedOnServer } from '~/features/objects/actions';

/**
 * Handles an OBJ-DEL message from a server and updates the state of the Redux
 * store appropriately.
 *
 * @param  {Object} body  the body of the OBJ-DEL message
 * @param  {function} dispatch  the dispatch function of the Redux store
 */
export function handleObjectDeletionMessage(body, dispatch) {
  /* TODO(ntamas): we have to decide whether deleting the object from the client
   * is a good idea or not. In the extreme case, if a drone is removed from the
   * server due to a timeout but it comes back in a few seconds, we could be
   * needlessly removing the drone from the client as well.
   */

  const { ids } = body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return;
  }

  /* Unfortunately the server does not tell us which type the object is, so
   * we just dispatch an action; this action will be responded to by all
   * reducers where we can potentially store objects that need to respond to
   * deletions on the server */
  dispatch(notifyObjectsDeletedOnServer(ids));
}
