/* eslint-disable @typescript-eslint/naming-convention */
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  GroupedVirtuoso,
  type GroupedVirtuosoHandle,
  type GroupedVirtuosoProps,
} from 'react-virtuoso';
import { makeStyles } from '@material-ui/core/styles';

import { HEIGHT as sortAndFilterHeaderHeight } from './SortAndFilterHeader';
import type { UAVListBodyProps } from './UAVListBody';
import UAVListSubheader from './UAVListSubheader';
import type { Item, UAVGroup } from './types';
import { getLabelForUAVGroup } from './utils';

const useStyles = makeStyles(
  {
    grid: {},

    list: {
      alignItems: 'stretch',
      fontSize: '12px',
    },

    listHeader: {
      // use a background color when the list header is floating to ensure that
      // it covers the items below it
      // backgroundColor: theme.palette.background.paper,
      paddingTop: sortAndFilterHeaderHeight,
    },
  },
  { name: 'UAVListSection' }
);

type VirtualizedUAVListBodyProps = UAVListBodyProps &
  Pick<GroupedVirtuosoProps<Item, UAVGroup>, 'restoreStateFrom' | 'onScroll'>;

/**
 * Presentation component for showing the drone show configuration view.
 */
const VirtualizedUAVListBody = React.forwardRef<
  GroupedVirtuosoHandle,
  VirtualizedUAVListBodyProps
>((props, ref): JSX.Element => {
  const {
    groups,
    itemRenderer,
    layout,
    onSelectSection,
    selectionInfo,
    ...rest
  } = props;
  const classes = useStyles();
  const { t } = useTranslation();

  const groupCounts = groups.map((group) => group.items.length);

  return (
    <GroupedVirtuoso
      ref={ref}
      className={classes.list}
      components={{
        TopItemList: React.Fragment, // for non-sticky group headers
      }}
      groupCounts={groupCounts}
      groupContent={(index) => (
        <UAVListSubheader
          className={classes.listHeader}
          label={getLabelForUAVGroup(groups[index]!, t)}
          value={groups[index]!.id}
          onSelect={onSelectSection}
          {...selectionInfo[index]}
        />
      )}
      increaseViewportBy={50} // to account for the flickering due to non-sticky headers
      itemContent={(index, groupIndex) =>
        itemRenderer(groups[groupIndex]!.items[index]!)
      }
      {...rest}
    />
  );
});

export default VirtualizedUAVListBody;
