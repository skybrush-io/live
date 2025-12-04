import type { PayloadAction } from '@reduxjs/toolkit';

import {
  Direction,
  createKeyboardNavigationHandlers as createKeyboardNavigationHandlers_,
  type KeyboardNavigationHandlers,
} from '~/features/hotkeys/navigation';
import { setSelection } from '~/features/map/selection';
import { getUAVListOrientation } from '~/features/settings/selectors';
import { UAVListOrientation } from '~/features/settings/types';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { globalIdToUavId } from '~/model/identifiers';
import type { AppDispatch, RootState } from '~/store/reducers';

import { GRID_ITEM_WIDTH } from './constants';
import { getGlobalIdsOfDisplayedItems } from './selectors';
import { getSelectedUAVIdsAndMissionSlotIds } from './utils';

/**
 * Estimates the number of columns in the grid based on the width of the
 * container. This is used to determine how many items to move when the user
 * presses the arrow keys in the grid view.
 */
const getColumnCount = (containerDOMNodeId: string): number => {
  const containerDOMNode = document.querySelector(`#${containerDOMNodeId}`);

  // Assumption: the width of the container divided by 80 is an estimate of
  // how many columns there are in the grid.
  //
  // In theory we could also do this by getting the computed style of the
  // container, see https://stackoverflow.com/questions/55204205/
  const { width: containerWidth } =
    containerDOMNode?.getBoundingClientRect() ?? {};
  if (typeof containerWidth === 'number' && containerWidth > 0) {
    return Math.max(1, Math.floor(containerWidth / GRID_ITEM_WIDTH));
  } else {
    return 1;
  }
};

/**
 * Returns the keyboard navigation delta in a given direction in the UAV list
 * or grid view.
 *
 * This is an auxiliary function used by the UAV list and grid view to determine
 * how many items to move in a given direction when the user presses the arrow
 * keys.
 *
 * @param state  the current state of the application
 * @param direction  the direction in which to navigate
 * @returns  the number of items to move in the given direction
 */
const getNavigationDeltaInDirection =
  (containerDOMNodeId: string) =>
  (state: RootState, direction: Direction): number => {
    const orientation = getUAVListOrientation(state);

    if (orientation === UAVListOrientation.VERTICAL) {
      // Vertical layout. Horizontal navigation is disallowed and we always
      // step by 1 vertically.
      switch (direction) {
        case Direction.DOWN:
          return 1;
        case Direction.UP:
          return -1;
        case Direction.NEXT_PAGE:
          return 10;
        case Direction.PREVIOUS_PAGE:
          return -10;
        default:
          return 0;
      }
    } else {
      // Horizontal layout. We always step by 1 horizontally. In vertical
      // direction we need to figure out how many columns there are.
      switch (direction) {
        case Direction.LEFT:
          return -1;
        case Direction.RIGHT:
          return 1;
        case Direction.UP:
        case Direction.PREVIOUS_PAGE:
          return -getColumnCount(containerDOMNodeId);
        case Direction.DOWN:
        case Direction.NEXT_PAGE:
          return getColumnCount(containerDOMNodeId);

        default:
          return 0;
      }
    }
  };

/**
 * Opens the UAV details dialog for the given global ID if it represents a UAV.
 * No-op otherwise.
 */
export function maybeOpenUAVDetailsDialog(
  globalId: string
): PayloadAction<string> | undefined {
  const uavId = globalIdToUavId(globalId);
  if (uavId) {
    return openUAVDetailsDialog(uavId);
  }
}

export default function createKeyboardNavigationHandlers(
  dispatch: AppDispatch,
  containerDOMNodeId: string,
  onIndexFocused: (index: number) => void
): KeyboardNavigationHandlers {
  return createKeyboardNavigationHandlers_({
    dispatch,
    activateId: maybeOpenUAVDetailsDialog,
    getNavigationDeltaInDirection:
      getNavigationDeltaInDirection(containerDOMNodeId),
    getVisibleIds: getGlobalIdsOfDisplayedItems,
    getSelectedIds: getSelectedUAVIdsAndMissionSlotIds,
    onItemFocused(_id, index) {
      onIndexFocused(index);
    },
    setSelectedIds: setSelection,
  });
}
