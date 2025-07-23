import Box from '@mui/material/Box';
import React from 'react';

import MissionOverviewList from './MissionOverviewList';
import MissionOverviewPanelFooter from './MissionOverviewPanelFooter';
import MissionOverviewPanelHeader from './MissionOverviewPanelHeader';
import MissionOverviewPanelStatusBar from './MissionOverviewPanelStatusBar';

/**
 * Panel that shows the widgets that are needed to edit a waypoint-based mission
 * for one or more drones.
 */
const MissionOverviewPanel = () => (
  <Box display='flex' flexDirection='column' height='100%'>
    <MissionOverviewPanelHeader />
    <MissionOverviewList />
    <MissionOverviewPanelStatusBar />
    <MissionOverviewPanelFooter />
  </Box>
);

export default MissionOverviewPanel;
