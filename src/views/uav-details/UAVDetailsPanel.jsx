import React from 'react';

import Box from '@material-ui/core/Box';

import UAVDetailsPanelBody from './UAVDetailsPanelBody';
import UAVDetailsPanelHeader from './UAVDetailsPanelHeader';

/**
 * Panel that shows the widgets that are needed to monitor and control one
 * specific drone and it's devices.
 */
const UAVDetailsPanel = () => (
  <Box display='flex' flexDirection='column' height='100%'>
    <UAVDetailsPanelHeader />
    <UAVDetailsPanelBody />
  </Box>
);

export default UAVDetailsPanel;
