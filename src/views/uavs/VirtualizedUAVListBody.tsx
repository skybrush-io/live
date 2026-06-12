import TableRow from '@mui/material/TableRow';
import React, { useMemo } from 'react';
import { connect } from 'react-redux';
import { TableVirtuoso, VirtuosoGrid } from 'react-virtuoso';

import { makeStyles } from '@skybrush/app-theme-mui';

import { UAVListLayout } from '~/features/settings/types';
import type { RootState } from '~/store/reducers';
import type { VirtualizedScrollFunctions } from '~/utils/navigation';

import UAVListColumnHeaderRow from './UAVListColumnHeaderRow';
import {
  createUAVListTableComponents,
  UAVListTableCell,
  UAVListTableHeaderCell,
} from './uavListTableComponents';
import {
  GRID_ITEM_WIDTH,
  GRID_ROW_HEIGHT,
  LIST_ROW_HEIGHT,
} from './constants';
import { getDisplayedItems } from './selectors';
import type { Item } from './types';

const useStyles = makeStyles((theme) => ({
  grid: {
    display: 'grid',
    gap: theme.spacing(1),
    gridTemplateColumns: `repeat(auto-fill, minmax(${GRID_ITEM_WIDTH}px, 1fr))`,
    gridTemplateRows: GRID_ROW_HEIGHT,
    gridAutoRows: GRID_ROW_HEIGHT,
    padding: theme.spacing(1, 1, 2),
  },

  gridItem: {},

  tableVirtuoso: {
    height: '100%',
  },
}));

type VirtualizedUAVListBodyProps = Readonly<{
  id?: string;
  items: Item[];
  itemRenderer: (item: Item, index: number) => React.ReactNode;
  layout: UAVListLayout;
}>;

const VirtualizedUAVListBody = React.forwardRef<
  VirtualizedScrollFunctions | undefined,
  VirtualizedUAVListBodyProps
>((props, ref): React.JSX.Element => {
  const { items, itemRenderer, layout, ...rest } = props;
  const classes = useStyles();
  const tableComponents = useMemo(() => createUAVListTableComponents(), []);

  if (layout === UAVListLayout.GRID) {
    return (
      <VirtuosoGrid
        ref={ref}
        itemClassName={classes.gridItem}
        itemContent={(index) => itemRenderer(items[index]!, index)}
        listClassName={classes.grid}
        totalCount={items.length}
        {...(rest as any)}
      />
    );
  }

  return (
    <TableVirtuoso<Item>
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      ref={ref as any}
      className={classes.tableVirtuoso}
      components={tableComponents}
      data={items}
      fixedHeaderContent={() => (
        <TableRow>
          <UAVListTableHeaderCell>
            <UAVListColumnHeaderRow />
          </UAVListTableHeaderCell>
        </TableRow>
      )}
      fixedItemHeight={LIST_ROW_HEIGHT}
      itemContent={(index, item) => (
        <UAVListTableCell>{itemRenderer(item, index)}</UAVListTableCell>
      )}
      {...rest}
    />
  );
});

export default connect(
  (state: RootState) => ({
    items: getDisplayedItems(state),
  }),
  {},
  null,
  { forwardRef: true }
)(VirtualizedUAVListBody);
