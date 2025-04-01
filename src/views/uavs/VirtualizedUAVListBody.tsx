import React from 'react';
import {
  Virtuoso,
  VirtuosoGrid,
  type FlatIndexLocationWithAlign,
  type FlatScrollIntoViewLocation,
  type VirtuosoProps,
} from 'react-virtuoso';
import { makeStyles } from '@material-ui/core/styles';

import { UAVListLayout } from '~/features/settings/types';

import type { UAVListSectionProps } from './UAVListSection';
import { GRID_ITEM_WIDTH, GRID_ROW_HEIGHT, HEADER_HEIGHT } from './constants';
import type { Item, UAVGroup } from './types';
import Box from '@material-ui/core/Box';

const useStyles = makeStyles(
  {
    grid: {
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, ${GRID_ITEM_WIDTH}px)`,
      gridTemplateRows: GRID_ROW_HEIGHT,
      gridAutoRows: GRID_ROW_HEIGHT,
    },

    gridItem: {},

    list: {
      alignItems: 'stretch',
      fontSize: '12px',
    },
  },
  { name: 'UAVListSection' }
);

type VirtualizedUAVListBodyProps = Readonly<{
  id?: string;
  items: Item[];
  itemRenderer: UAVListSectionProps['itemRenderer'];
  layout: UAVListLayout;
  restoreStateFrom?: any;
}> &
  Pick<VirtuosoProps<Item, UAVGroup>, 'onScroll'>;

/**
 * Padding that is placed as the topmost item in the virtual grid layout to
 * ensure that the real grid starts "below" the SortAndFilterHeader component
 * that is supposed to float above the grid.
 */
const GridHeaderPadding = (): JSX.Element => (
  <Box sx={{ height: HEADER_HEIGHT }} />
);

export type VirtuosoCommonHandle = {
  scrollIntoView?: (location: FlatScrollIntoViewLocation) => void; // for lists
  scrollToIndex?: (location: FlatIndexLocationWithAlign) => void; // for grids
};

/**
 * Presentation component for showing the drone show configuration view.
 */
const VirtualizedUAVListBody = React.forwardRef<
  VirtuosoCommonHandle | undefined,
  VirtualizedUAVListBodyProps
>((props, ref): JSX.Element => {
  const { items, itemRenderer, layout, ...rest } = props;
  const classes = useStyles();

  return layout === UAVListLayout.GRID ? (
    <VirtuosoGrid
      ref={ref}
      components={{
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Header: GridHeaderPadding,
      }}
      itemClassName={classes.gridItem}
      itemContent={(index) => itemRenderer(items[index]!)}
      listClassName={classes.grid}
      totalCount={items.length}
      {...(rest as any)}
    />
  ) : (
    <Virtuoso
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ref={ref as any}
      className={classes.list}
      components={{
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Header: GridHeaderPadding,
      }}
      itemContent={(index) => itemRenderer(items[index]!)}
      totalCount={items.length}
      {...rest}
    />
  );
});

export default VirtualizedUAVListBody;
