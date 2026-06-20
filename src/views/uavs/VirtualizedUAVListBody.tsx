import Box from '@mui/material/Box';
import React, { type Ref } from 'react';
import { connect } from 'react-redux';
import { Virtuoso, VirtuosoGrid, type VirtuosoHandle } from 'react-virtuoso';

import { makeStyles } from '@skybrush/app-theme-mui';

import { UAVListLayout } from '~/features/settings/types';
import type { RootState } from '~/store/reducers';

import type { UAVListSectionProps } from './UAVListSection';
import { GRID_ITEM_WIDTH, GRID_ROW_HEIGHT, HEADER_HEIGHT } from './constants';
import { getDisplayedItems } from './selectors';
import type { Item } from './types';

const useStyles = makeStyles({
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
});

type VirtualizedUAVListBodyProps = Readonly<{
  id?: string;
  items: Item[];
  itemRenderer: UAVListSectionProps['itemRenderer'];
  layout: UAVListLayout;
  ref?: Ref<VirtuosoHandle>;
}>;

/**
 * Padding that is placed as the topmost item in the virtual grid layout to
 * ensure that the real grid starts "below" the SortAndFilterHeader component
 * that is supposed to float above the grid.
 */
const GridHeaderPadding = (): React.JSX.Element => (
  <Box sx={{ height: HEADER_HEIGHT }} />
);

/**
 * Presentation component for showing the drone show configuration view.
 */
const VirtualizedUAVListBody = (
  props: VirtualizedUAVListBodyProps
): React.JSX.Element => {
  const { items, itemRenderer, layout, ref, ...rest } = props;
  const classes = useStyles();

  return layout === UAVListLayout.GRID ? (
    <VirtuosoGrid
      ref={ref}
      components={{
        Header: GridHeaderPadding,
      }}
      itemClassName={classes.gridItem}
      itemContent={(index) => itemRenderer(items[index])}
      listClassName={classes.grid}
      totalCount={items.length}
      {...(rest as any)}
    />
  ) : (
    <Virtuoso
      ref={ref}
      className={classes.list}
      components={{
        Header: GridHeaderPadding,
      }}
      itemContent={(index) => itemRenderer(items[index])}
      totalCount={items.length}
      {...rest}
    />
  );
};

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
