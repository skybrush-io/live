import Box from '@mui/material/Box';
import makeStyles from '@mui/styles/makeStyles';
import React from 'react';
import { connect } from 'react-redux';
import { Virtuoso, VirtuosoGrid } from 'react-virtuoso';

import { UAVListLayout } from '~/features/settings/types';
import type { RootState } from '~/store/reducers';
import type { VirtualizedScrollFunctions } from '~/utils/navigation';

import type { UAVListSectionProps } from './UAVListSection';
import { GRID_ITEM_WIDTH, GRID_ROW_HEIGHT, HEADER_HEIGHT } from './constants';
import { getDisplayedItems } from './selectors';
import type { Item } from './types';

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
}>;

/**
 * Padding that is placed as the topmost item in the virtual grid layout to
 * ensure that the real grid starts "below" the SortAndFilterHeader component
 * that is supposed to float above the grid.
 */
const GridHeaderPadding = (): JSX.Element => (
  <Box sx={{ height: HEADER_HEIGHT }} />
);

/**
 * Presentation component for showing the drone show configuration view.
 */
const VirtualizedUAVListBody = React.forwardRef<
  VirtualizedScrollFunctions | undefined,
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

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    // items are extracted here from the state and not in UAVList to avoid
    // re-rendering UAVList constantly when the list is sorted and thus the items
    // array changes frequently
    items: getDisplayedItems(state),
  }),
  // mapDispatchToProps
  {},
  // mergeProps
  null,
  // options
  { forwardRef: true }
)(VirtualizedUAVListBody);
