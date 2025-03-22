import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { UAVListLayout } from '~/features/settings/types';

import UAVListSubheader, {
  type UAVListSubheaderProps,
} from './UAVListSubheader';
import type { Item } from './types';

const useStyles = makeStyles(
  (theme) => ({
    grid: {
      display: 'flex',
      flexDirection: 'row',
      flexWrap: 'wrap',

      // eslint-disable-next-line @typescript-eslint/naming-convention
      '&>div': {
        padding: theme.spacing(1),
      },
    },

    list: {
      display: 'flex',
      alignItems: 'stretch',
      flexDirection: 'column',
      fontSize: '12px',

      // eslint-disable-next-line @typescript-eslint/naming-convention
      '&>div': {
        padding: theme.spacing(0.5),
        borderBottom: `1px solid ${theme.palette.divider}`,
      },

      // eslint-disable-next-line @typescript-eslint/naming-convention
      '&>div:first-child': {
        borderTop: `1px solid ${theme.palette.divider}`,
      },
    },
  }),
  { name: 'UAVListSection' }
);

export type UAVListSectionProps = UAVListSubheaderProps &
  Readonly<{
    forceVisible?: boolean;
    items: Item[];
    itemRenderer: (item: Item) => React.ReactNode;
    layout: UAVListLayout;
  }>;

const UAVListSection = ({
  forceVisible,
  items: ids,
  itemRenderer,
  layout,
  ...rest
  // eslint-disable-next-line @typescript-eslint/ban-types
}: UAVListSectionProps): JSX.Element | null => {
  const classes = useStyles();

  if (ids.length <= 0 && !forceVisible) {
    return null;
  }

  return (
    <>
      <UAVListSubheader {...rest} />
      <Box
        className={layout === UAVListLayout.GRID ? classes.grid : classes.list}
      >
        {ids.map((id) => itemRenderer(id))}
      </Box>
    </>
  );
};

export default UAVListSection;
