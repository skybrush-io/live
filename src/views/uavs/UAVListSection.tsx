import Box from '@mui/material/Box';
import type { Theme } from '@mui/material/styles';
import type React from 'react';

import { makeStyles } from '@skybrush/app-theme-mui';

import { UAVListLayout } from '~/features/settings/types';

import UAVListSubheader, {
  type UAVListSubheaderProps,
} from './UAVListSubheader';
import type { Item } from './types';

const useStyles = makeStyles((theme: Theme) => ({
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
  },
}));

export type UAVListSectionProps = UAVListSubheaderProps &
  Readonly<{
    items: Item[];
    itemRenderer: (item: Item) => React.ReactNode;
    layout: UAVListLayout;
  }>;

const UAVListSection = ({
  items: ids,
  itemRenderer,
  layout,
  ...rest
}: UAVListSectionProps): React.JSX.Element | null => {
  const classes = useStyles();
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
