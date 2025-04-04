/* eslint-disable @typescript-eslint/ban-types */
import type {
  CalculateViewLocationParams,
  FlatIndexLocationWithAlign,
  FlatScrollIntoViewLocation,
} from 'react-virtuoso';
import { uavIdToDOMNodeId } from '~/views/uavs/utils';

/**
 * Scrolls the first element matching the given CSS selector,
 * or the given element into view.
 *
 * @return  whether the element was found and scrolled into view.
 */
export function scrollIntoView(target: string | HTMLElement): boolean {
  const element =
    typeof target === 'string' ? document.querySelector(target) : target;

  if (element) {
    window.requestAnimationFrame(() => {
      element.scrollIntoView({
        behavior: 'auto',
        block: 'nearest',
        inline: 'nearest',
      });
    });
    return true;
  } else {
    return false;
  }
}

/**
 * Helper function to calculate the location to scroll to in a virtualized list,
 * taking into account the size of an optional header.
 *
 * Returns a function that takes the top and bottom margins of the item and the
 * viewport and returns an object that is suitable to be forwarded to the
 * scroller functions of `react-virtuoso`.
 */
const calculateViewLocationInListWithHeader = ({
  headerHeight = 0,
}: {
  headerHeight: number;
}) => {
  if (headerHeight < 0) {
    headerHeight = 0;
  }

  return ({
    itemBottom,
    itemTop,
    viewportBottom,
    viewportTop,
    locationParams,
  }: CalculateViewLocationParams): FlatIndexLocationWithAlign | null => {
    // Default implementation taken from here:
    // https://virtuoso.dev/virtuoso-api/interfaces/FlatScrollIntoViewLocation/
    //
    // Adjusted to take into account the header height.

    if (itemTop < viewportTop + headerHeight) {
      const { align, ...rest } = locationParams as FlatIndexLocationWithAlign;
      const offset = align ? 0 : -headerHeight;
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
  };
};

/**
 * Type representing the methods that we are going to use from the handles
 * provided by `react-virtuoso` for lists and grids.
 *
 * Unfortunately these two types use different method names and we need to
 * cater for both, hence this type.
 */
export type VirtualizedScrollFunctions = {
  scrollIntoView?: (location: FlatScrollIntoViewLocation) => void; // for lists
  scrollToIndex?: (location: FlatIndexLocationWithAlign) => void; // for grids
};

/**
 * Type representing a function that can be used to scroll a virtualized list or
 * grid component to a given index.
 */
export type ScrollerToIndex = (index: number) => boolean;

export type ScrollerToIndexFactoryOptions = {
  functions: VirtualizedScrollFunctions | null | undefined;
  headerHeight: number;
};

/**
 * Helper that creates a function that attempts to scroll the item with the
 * given into index into view in a virtualized list or grid component.
 *
 * @return whether the item was scrolled into view.
 */
export const createScrollerToIndex = ({
  functions,
  headerHeight = 0,
}: ScrollerToIndexFactoryOptions) => {
  const calculateViewLocation = calculateViewLocationInListWithHeader({
    headerHeight,
  });
  return (index: number): boolean => {
    if (!functions) {
      return false;
    }

    if (functions.scrollIntoView) {
      // for lists
      functions.scrollIntoView({
        index,
        calculateViewLocation,
      });
      return true;
    } else if (functions.scrollToIndex) {
      // for grids
      // TODO(ntamas): this does not really work nice yet as it strives to
      // scroll the item to the center of the viewport, but it should leave
      // the scroll position as is when the item is already visible.
      functions.scrollToIndex({ index, align: 'center' });
      return true;
    } else {
      return false;
    }
  };
};

/**
 * Type representing the registration of a virtualized list or grid component
 * that we are going to scroll programmatically in response to certain user
 * actions.
 *
 * Code that _provides_ virtualized components that are to be controlled
 * programmatically should register the components under a string identifier.
 * Code that wishes to trigger scrolling in the list or grid should
 * provide the ID of the component and the ID of the item to scroll to.
 * The functions in this type are used to figure out how to scroll to the
 * item in the list or grid.
 */
export type VirtualizedScrollableComponentRegistration = {
  id: string;
  getIndexOfItem: (id: string) => number;
  scrollToIndex: ScrollerToIndex;
};

const _virtualizedScrollableComponents: Record<
  string,
  VirtualizedScrollableComponentRegistration
> = {};

/**
 * Registers a virtualized list or grid component that can be scrolled
 * programmatically from other parts of the code.
 *
 * @param component  The component to register
 * @returns  A function to unregister the component
 */
export function registerVirtualizedScrollableComponent(
  component: VirtualizedScrollableComponentRegistration
): () => void {
  if (_virtualizedScrollableComponents[component.id]) {
    console.warn(
      `Component with ID ${component.id} already registered. Overwriting.`
    );
  }

  _virtualizedScrollableComponents[component.id] = component;
  return () => {
    delete _virtualizedScrollableComponents[component.id];
  };
}

/**
 * Enum containing the IDs of the virtualized components that are registered
 * in the application.
 */
export enum VirtualizedScrollableComponentId {
  UAV_LIST = 'uavList',
}

/**
 * Scrolls the element showing the data of the UAV with the given ID into
 * view.
 *
 * @return whether the element was found and scrolled into view.
 */
export function scrollUAVListItemIntoView(uavId: string): boolean {
  // Try based on DOM node first -- this works with non-virtualized UAV lists
  // and virtualized lists where the UAV is already in the viewport.
  const domNodeId = uavIdToDOMNodeId(uavId);
  if (!domNodeId) {
    return false;
  }

  if (scrollIntoView(`#${domNodeId}`)) {
    return true;
  }

  // UAV list is virtualized and the element is not in the DOM yet. Try to scroll
  // to the index of the UAV in the list.
  const component =
    _virtualizedScrollableComponents[VirtualizedScrollableComponentId.UAV_LIST];
  if (!component) {
    return false;
  }

  const index = component.getIndexOfItem(uavId);
  if (index >= 0) {
    return component.scrollToIndex(index);
  } else {
    return false;
  }
}
