/* eslint-disable @typescript-eslint/naming-convention */
import isNil from 'lodash-es/isNil';
import { bindActionCreators } from '@reduxjs/toolkit';

import type { AppDispatch, AppThunk, RootState } from '~/store/reducers';
import { scrollIntoView } from '~/utils/navigation';

export enum Direction {
  UP = 'up',
  DOWN = 'down',
  LEFT = 'left',
  RIGHT = 'right',
  PREVIOUS_PAGE = 'previousPage',
  NEXT_PAGE = 'nextPage',
}

export type KeyboardNavigationOptions<
  S = RootState,
  D extends (...args: any) => any = AppDispatch,
> = {
  dispatch: D;
  activateId?: (id: string) => Parameters<D>[0] | undefined;
  activateIds?: (ids: string[]) => Parameters<D>[0] | undefined;
  getNavigationDeltaInDirection: (state: S, direction: Direction) => number;
  getSelectedIds: (state: S) => string[];
  getVisibleIds: (state: S) => string[];
  onItemFocused: (id: string, index: number) => string | void;
  setSelectedIds: (ids: string[]) => Parameters<D>[0] | undefined;
};

export type KeyboardNavigationHandlers<
  D extends (...args: any) => any = AppDispatch,
> = {
  ACTIVATE_SELECTION: () => Parameters<D>[0];
  PAGE_DOWN: (event: KeyboardEvent) => Parameters<D>[0];
  PAGE_UP: (event: KeyboardEvent) => Parameters<D>[0];
  SELECT_FIRST: (event: KeyboardEvent) => Parameters<D>[0];
  SELECT_LAST: (event: KeyboardEvent) => Parameters<D>[0];
  SELECT_DOWN: (event: KeyboardEvent) => Parameters<D>[0];
  SELECT_UP: (event: KeyboardEvent) => Parameters<D>[0];
  SELECT_LEFT: (event: KeyboardEvent) => Parameters<D>[0];
  SELECT_RIGHT: (event: KeyboardEvent) => Parameters<D>[0];
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
 * @param {func} onItemFocused Plain function that is called when an item is
 *        about to be selected. The function receives the ID and index of the
 *        item being selected. It can be used to trigger a side-effect that
 *        scrolls a view to make the item visible. When it returns a string,
 *        it is interpreted as a CSS selector, and the first element matching
 *        the selector will be scrolled into view. Otherwise, the return value
 *        is ignored, but you can still perform any side effect inside the
 *        handler.
 * @param {func} setSelectedIds Redux action factory that creates an action that
 *        updates the currently selected IDs in the list when dispatched to the
 *        store
 */
export function createKeyboardNavigationHandlers<
  S = RootState,
  D extends (...args: any) => any = AppDispatch,
>({
  dispatch,
  activateId,
  activateIds,
  getNavigationDeltaInDirection,
  getVisibleIds,
  getSelectedIds,
  onItemFocused,
  setSelectedIds,
}: KeyboardNavigationOptions<S, D>): KeyboardNavigationHandlers<D> {
  const activateSelection =
    () =>
    (dispatch: D, getState: () => S): void => {
      if (!activateId && !activateIds) {
        // No action to perform
        return;
      }

      const state = getState();
      const selectedIds = getSelectedIds(state);
      if (selectedIds && selectedIds.length > 0) {
        const action = activateIds
          ? activateIds(selectedIds)
          : activateId!(selectedIds.at(-1)!);
        if (action) {
          dispatch(action);
        }
      }
    };

  const dispatchActionForAdjustingSelectionByDelta = (
    event: KeyboardEvent,
    delta: number,
    dispatch: D,
    getState: () => S
  ): void => {
    const state = getState();
    const visibleIds = getVisibleIds(state);

    if (visibleIds.length === 0) {
      // No items, nothing to do
      return;
    }

    const selectedIds = getSelectedIds(state);
    let caretIndex = -1;
    let newIndex = 0;

    // We don't really have the concept of a "caret" in the list, but the
    // navigation keys are expected to move as if we had one. If we had no
    // selection yet, we assume that the caret index is -1 (no caret); otherwise
    // if the delta is negative (we are moving upwards) we assume that the caret
    // is the topmost item in the selection, and if the delta is positive (we are
    // moving downwards) we assume that the caret is the lowermost item in the
    // selection. This works well enough for most of the cases.
    if (Number.isFinite(delta) && selectedIds.length > 0) {
      const indices = selectedIds
        .map((uavId) => visibleIds.indexOf(uavId))
        .filter((index) => index >= 0);
      if (delta < 0) {
        caretIndex = Math.min(visibleIds.length - 1, ...indices);
      } else {
        caretIndex = Math.max(0, ...indices);
      }
    }

    if (Number.isFinite(delta)) {
      newIndex = caretIndex + delta;
    } else if (delta < 0) {
      newIndex = 0;
    } else {
      newIndex = visibleIds.length - 1;
    }

    const newSelectedId = visibleIds[newIndex];
    const newSelection = isNil(newSelectedId)
      ? selectedIds
      : event.shiftKey
        ? selectedIds.includes(newSelectedId)
          ? null
          : /* TODO: we should select all items between caretIndex and newIndex,
             * inclusive, but we should also make sure that the selection does
             * not have duplicates */
            [...selectedIds, newSelectedId]
        : [newSelectedId];

    // If we have a focus callback, call it so we can scroll to the newly
    // selected item
    if (onItemFocused && !isNil(newSelectedId)) {
      const result = onItemFocused(newSelectedId, newIndex);
      if (typeof result === 'string') {
        scrollIntoView(result);
      }
    }

    if (newSelection !== null) {
      dispatch(setSelectedIds(newSelection));
    }
  };

  const adjustSelectionByDelta =
    (delta: number) =>
    (event: KeyboardEvent) =>
    (dispatch: D, getState: () => S): void => {
      dispatchActionForAdjustingSelectionByDelta(
        event,
        delta,
        dispatch,
        getState
      );
    };

  const adjustSelectionInDirection =
    (direction: Direction) =>
    (event: KeyboardEvent) =>
    (dispatch: D, getState: () => S): void => {
      // We need to prevent the browser from adjusting the selection of the _text_
      // of the webpage when the Shift key is held down
      event.preventDefault();

      const state = getState();
      const delta = getNavigationDeltaInDirection(state, direction);
      if (delta !== 0) {
        dispatchActionForAdjustingSelectionByDelta(
          event,
          delta,
          dispatch,
          getState
        );
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
