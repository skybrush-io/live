import isNil from 'lodash-es/isNil';
import { bindActionCreators } from '@reduxjs/toolkit';

import { scrollIntoView } from '~/utils/navigation';

export const Direction = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  PREVIOUS_PAGE: 'previousPage',
  NEXT_PAGE: 'nextPage',
};

/**
 * Creates a hotkey handler map that maps keyboard navigation related hotkey
 * action names to the corresponding handler functions in a way that is suitable
 * for managing the selection in a list-like view.
 *
 * @param {func} dispatch  the Redux action dispatcher function
 * @param {func} activateId Redux action factory that creates an action
 *        that handles the event when the user attempts to activate a _single_
 *        selected item. The factory is called with the ID of the selected item.
 *        When multiple items are selected, the _last_ item is activated.
 * @param {func} activateIds Redux action factory that creates an action
 *        that handles the event when the user attempts to activate the currently
 *        selected items. The factory is called with the currently selected IDs in
 *        an _array_.
 * @param {func} getVisibleIds  Redux selector that returns the array of IDs
 *        currently visible in the list, in the same order as they are displayed
 * @param {func} getSelectedIds Redux selector that returns the array of IDs
 *        that are currently selected in the list
 * @param {func} setSelectedIds Redux action factory that creates an action that
 *        updates the currently selected IDs in the list when dispatched to the
 *        store
 * @param {func} setFocusToId Plain function that is called when an item with the given
 *        ID is about to be selected. It can be used to trigger a side-effect
 *        that scrolls a view to make the item visible. When it returns a string,
 *        it is interpreted as a CSS selector, and the first element matching
 *        the selector will be scrolled into view. Otherwise, the return value
 *        is ignored, but you can still perform any side effect inside the
 *        handler.
 */
export function createKeyboardNavigationHandlers({
  dispatch,
  activateId,
  activateIds,
  getNavigationDeltaInDirection,
  getVisibleIds,
  getSelectedIds,
  setFocusToId,
  setSelectedIds,
}) {
  const activateSelection =
    activateId || activateIds
      ? () => (dispatch, getState) => {
          const state = getState();
          const selectedIds = getSelectedIds(state);
          if (selectedIds && selectedIds.length > 0) {
            if (activateIds) {
              dispatch(activateIds(selectedIds));
            } else {
              dispatch(activateId(selectedIds[selectedIds.length - 1]));
            }
          }
        }
      : undefined;

  const dispatchActionForAdjustingSelectionByDelta = (
    event,
    delta,
    dispatch,
    getState
  ) => {
    const state = getState();
    const visibleIds = getVisibleIds(state);

    if (visibleIds.length === 0) {
      // No items, nothing to do
      return;
    }

    const selectedIds = getSelectedIds(state);
    let newIndex = 0;

    if (Number.isFinite(delta)) {
      if (selectedIds.length > 0) {
        // Select the item above the topmost selected item if delta is
        // negative, or select the item below the lowermost selected item if
        // delta is positive, and deselect the rest
        const indices = selectedIds
          .map((uavId) => visibleIds.indexOf(uavId))
          .filter((index) => index >= 0);
        if (delta < 0) {
          newIndex = Math.min(visibleIds.length - 1, ...indices) + delta;
        } else {
          newIndex = Math.max(0, ...indices) + delta;
        }
      }

      newIndex = Math.min(Math.max(newIndex, 0), visibleIds.length - 1);
    } else if (delta < 0) {
      newIndex = 0;
    } else {
      newIndex = visibleIds.length - 1;
    }

    const newSelectedId = visibleIds[newIndex];
    const newSelection = event.shiftKey
      ? selectedIds.includes(newSelectedId)
        ? null
        : [...selectedIds, newSelectedId]
      : [newSelectedId];

    // If we have a focus callback, call it so we can scroll to the newly
    // selected item
    if (setFocusToId && !isNil(newSelectedId)) {
      const result = setFocusToId(newSelectedId);
      if (typeof result === 'string') {
        scrollIntoView(result);
      }
    }

    if (newSelection !== null) {
      dispatch(setSelectedIds(newSelection));
    }
  };

  const adjustSelectionByDelta = (delta) => (event) => (dispatch, getState) => {
    const action = dispatchActionForAdjustingSelectionByDelta(
      event,
      delta,
      dispatch,
      getState
    );
    if (action) {
      dispatch(action);
    }
  };

  const adjustSelectionInDirection =
    (direction) => (event) => (dispatch, getState) => {
      // We need to prevent the browser from adjusting the selection of the _text_
      // of the webpage when the Shift key is held down
      event.preventDefault();

      const state = getState();
      const delta = getNavigationDeltaInDirection(state, direction);
      if (delta !== 0) {
        const action = dispatchActionForAdjustingSelectionByDelta(
          event,
          delta,
          dispatch,
          getState
        );
        if (action) {
          dispatch(action);
        }
      }
    };

  return bindActionCreators(
    {
      ACTIVATE_SELECTION: activateSelection,
      PAGE_DOWN: adjustSelectionInDirection(Direction.NEXT_PAGE),
      PAGE_UP: adjustSelectionInDirection(Direction.PREVIOUS_PAGE),
      SELECT_FIRST: adjustSelectionByDelta(Number.NEGATIVE_INFINITY),
      SELECT_LAST: adjustSelectionByDelta(Number.POSITIVE_INFINITY),
      SELECT_DOWN: adjustSelectionInDirection(Direction.DOWN),
      SELECT_UP: adjustSelectionInDirection(Direction.UP),
      SELECT_LEFT: adjustSelectionInDirection(Direction.LEFT),
      SELECT_RIGHT: adjustSelectionInDirection(Direction.RIGHT),
    },
    dispatch
  );
}
