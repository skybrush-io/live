import { addDocksByIds } from '~/features/docks/slice';

/**
 * Handles a response to an OBJ-LIST message from a Skybrush server where
 * we queried the list of dock IDs, and updates the state of the Redux store
 * appropriately.
 *
 * @param  {string[]} dockIds  the array of dock IDs
 * @param  {function} dispatch  the dispatch function of the Redux store
 */
export function handleDockIdList(dockIds, dispatch) {
  dispatch(addDocksByIds(dockIds));
}
