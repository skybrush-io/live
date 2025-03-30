import React from 'react';
import {
  Virtuoso,
  type VirtuosoHandle,
  type VirtuosoProps,
} from 'react-virtuoso';
import { makeStyles } from '@material-ui/core/styles';

import type { UAVListLayout } from '~/features/settings/types';

import type { UAVListSectionProps } from './UAVListSection';
import type { Item, UAVGroup } from './types';
import SortAndFilterHeader, {
  HEIGHT as headerHeight,
} from './SortAndFilterHeader';

const useStyles = makeStyles(
  {
    grid: {},

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
}> &
  Pick<VirtuosoProps<Item, UAVGroup>, 'restoreStateFrom' | 'onScroll'>;

/**
 * Presentation component for showing the drone show configuration view.
 */
const VirtualizedUAVListBody = React.forwardRef<
  VirtuosoHandle,
  VirtualizedUAVListBodyProps
>((props, ref): JSX.Element => {
  const { items, itemRenderer, layout, ...rest } = props;
  const classes = useStyles();

  return (
    <Virtuoso
      ref={ref}
      className={classes.list}
      itemContent={(index) =>
        index > 0 ? itemRenderer(items[index - 1]!) : <SortAndFilterHeader />
      }
      topItemCount={1}
      totalCount={items.length + 1}
      increaseViewportBy={headerHeight}
      {...rest}
    />
  );
});

export default VirtualizedUAVListBody;
