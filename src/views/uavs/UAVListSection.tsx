import Box from '@material-ui/core/Box';
import { makeStyles } from '@material-ui/core/styles';
import React from 'react';
import { UAVListLayout } from '~/features/settings/types';

import UAVListSubheader, {
  type UAVListSubheaderProps,
} from './UAVListSubheader';

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
    ids: Array<[string | undefined, number | undefined]>;
    itemFactory: (
      id: [string | undefined, number | undefined]
    ) => React.ReactNode;
    layout: UAVListLayout;
  }>;

const UAVListSection = ({
  forceVisible,
  ids,
  itemFactory,
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
        {ids.map((id) => itemFactory(id))}
      </Box>
    </>
  );
};

export default UAVListSection;
