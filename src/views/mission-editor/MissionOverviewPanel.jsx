import React, { useState } from 'react';

import Box from '@material-ui/core/Box';
import MissionOverviewList from './MissionOverviewList';
import MissionOverviewPanelToolbar from './MissionOverviewPanelToolbar';

/**
 * Panel that shows the widgets that are needed to edit a waypoint-based mission
 * for one or more drones.
 */
const MissionOverviewPanel = () => (
  <Box display='flex' flexDirection='column' height='100%'>
    <MissionOverviewList />
    <MissionOverviewPanelToolbar />
  </Box>
);

export default MissionOverviewPanel;
