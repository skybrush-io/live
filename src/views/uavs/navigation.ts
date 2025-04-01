import type { PayloadAction } from '@reduxjs/toolkit';

import {
  Direction,
  createKeyboardNavigationHandlers,
  type KeyboardNavigationHandlers,
} from '~/features/hotkeys/navigation';
import { setSelection } from '~/features/map/selection';
import { getUAVListOrientation } from '~/features/settings/selectors';
import { UAVListOrientation } from '~/features/settings/types';
import { openUAVDetailsDialog } from '~/features/uavs/details';
import { globalIdToUavId } from '~/model/identifiers';
import type { AppDispatch, RootState } from '~/store/reducers';

import { GRID_ITEM_WIDTH, HEADER_HEIGHT } from './constants';
import { getGlobalIdsOfDisplayedItems } from './selectors';
import { getSelectedUAVIdsAndMissionSlotIds } from './utils';
import type { VirtuosoCommonHandle } from './VirtualizedUAVListBody';
import type {
  CalculateViewLocationParams,
  FlatIndexLocationWithAlign,
} from 'react-virtuoso';

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

        // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
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

/**
 * Helper function to calculate the location to scroll to in the UAV list,
 * taking into account the size of the header.
 */
function calculateViewLocationInList({
  itemBottom,
  itemTop,
  viewportBottom,
  viewportTop,
  locationParams,
  // eslint-disable-next-line @typescript-eslint/ban-types
}: CalculateViewLocationParams): FlatIndexLocationWithAlign | null {
  // Default implementation taken from here:
  // https://virtuoso.dev/virtuoso-api/interfaces/FlatScrollIntoViewLocation/
  //
  // Adjusted to take into account the header height.

  if (itemTop < viewportTop + HEADER_HEIGHT) {
    const { align, ...rest } = locationParams as FlatIndexLocationWithAlign;
    const offset = align ? 0 : -HEADER_HEIGHT;
    return {
      ...rest,
      align: align ?? 'start',
      offset,
    };
  }

  if (itemBottom > viewportBottom) {
    const { align, ...rest } = locationParams as FlatIndexLocationWithAlign;
    return { ...rest, align: align ?? 'end' };
  }

  return null;
}

export default function handleKeyboardNavigation(
  dispatch: AppDispatch,
  containerDOMNodeId: string,
  scrollerFunctions: React.RefObject<VirtuosoCommonHandle | undefined>
): KeyboardNavigationHandlers {
  return createKeyboardNavigationHandlers({
    dispatch,
    activateId: maybeOpenUAVDetailsDialog,
    getNavigationDeltaInDirection:
      getNavigationDeltaInDirection(containerDOMNodeId),
    getVisibleIds: getGlobalIdsOfDisplayedItems,
    getSelectedIds: getSelectedUAVIdsAndMissionSlotIds,
    onItemFocused(_id, index) {
      const funcs = scrollerFunctions.current;
      if (!funcs) {
        return;
      }

      if (funcs.scrollIntoView) {
        // for lists
        // TODO(ntamas): use calculateViewLocation() to ensure that the top
        // header does not cover the item being scrolled into view
        funcs.scrollIntoView({
          index,
          calculateViewLocation: calculateViewLocationInList,
        });
      } else if (funcs.scrollToIndex) {
        // for grids
        // TODO(ntamas): this does not really work nice yet as it strives to
        // scroll the item to the center of the viewport, but it should leave
        // the scroll position as is when the item is already visible.
        funcs.scrollToIndex({ index, align: 'center' });
      }
    },
    setSelectedIds: setSelection,
  });
}
