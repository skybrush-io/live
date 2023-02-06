import React from 'react';

import AppBar from '@material-ui/core/AppBar';
import { makeStyles } from '@material-ui/core/styles';
import { isThemeDark } from '@skybrush/app-theme-material-ui';

import UAVDetailsPanelSelect from './UAVDetailsPanelSelect';
import UAVDetailsPanelTabs from './UAVDetailsPanelTabs';
import UAVDetailsPanelUAVIdSelector from './UAVDetailsPanelUAVIdSelector';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      position: 'sticky',
      top: 0,

      containerType: 'inline-size',

      flexDirection: 'row',
      justifyContent: 'space-between',

      // Partially copied from @skybrush/mui-components/lib/DialogAppBar
      backgroundColor: isThemeDark(theme) ? '#535353' : '#fff',
      color: isThemeDark(theme)
        ? theme.palette.getContrastText('#535353')
        : '#000',
    },

    select: {
      '@container (min-width: 525px)': {
        display: 'none',
      },
    },

    tabs: {
      '@container (max-width: 526px)': {
        display: 'none',
      },
    },
  }),
  {
    name: 'UAVDetailsPanelHeader',
  }
);

/**
 * Header component for the panel that shows the widgets that are needed to
 * monitor and control one specific drone and it's devices.
 */
const UAVDetailsPanelHeader = () => {
  const classes = useStyles();

  return (
    <AppBar className={classes.root} style={{}}>
      <UAVDetailsPanelUAVIdSelector />
      <UAVDetailsPanelTabs className={classes.tabs} />
      <UAVDetailsPanelSelect className={classes.select} />
    </AppBar>
  );
};

export default UAVDetailsPanelHeader;
