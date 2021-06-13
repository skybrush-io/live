import { bindActionCreators } from '@reduxjs/toolkit';

/**
 * Creates a hotkey handler map that maps keyboard navigation related hotkey
 * action names to the corresponding handler functions in a way that is suitable
 * for managing the selection in a list-like view.
 *
 * @param {func} dispatch  the Redux action dispatcher function
 * @param {func} getVisibleIds  Redux selector that returns the array of IDs
 *        currently visible in the list, in the same order as they are displayed
 * @param {func} getSelectedIds Redux selector that returns the array of IDs
 *        that are currently selected in the list
 * @param {func} setSelectedIds Redux action factory that creates an action that
 *        updates the currently selected IDs in the list when dispatched to the
 *        store
 */
export function createKeyboardNavigationHandlers({
  dispatch,
  getVisibleIds,
  getSelectedIds,
  setSelectedIds,
}) {
  const adjustSelectionByDelta = (delta) => (event) => (dispatch, getState) => {
    // We need to prevent the browser from adjusting the selection of the _text_
    // of the webpage when the Shift key is held down
    event.preventDefault();

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

    if (newSelection !== null) {
      dispatch(setSelectedIds(newSelection));
    }
  };

  return bindActionCreators(
    {
      PAGE_DOWN: adjustSelectionByDelta(10),
      PAGE_UP: adjustSelectionByDelta(-10),
      SELECT_FIRST: adjustSelectionByDelta(Number.NEGATIVE_INFINITY),
      SELECT_LAST: adjustSelectionByDelta(Number.POSITIVE_INFINITY),
      SELECT_NEXT: adjustSelectionByDelta(1),
      SELECT_PREVIOUS: adjustSelectionByDelta(-1),
    },
    dispatch
  );
}
