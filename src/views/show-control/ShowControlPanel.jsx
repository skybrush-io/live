import Box from '@mui/material/Box';
import React from 'react';

import { hasFeature } from '~/utils/configuration';

import EnvironmentEditorDialog from './EnvironmentEditorDialog';
import LoadShowFromCloudDialog from './LoadShowFromCloudDialog';
import ManualPreflightChecksDialog from './ManualPreflightChecksDialog';
import OnboardPreflightChecksDialog from './OnboardPreflightChecksDialog';
import ShowControlPanelUpperSegment from './ShowControlPanelUpperSegment';
import StartTimeDialog from './StartTimeDialog';
import TakeoffAreaSetupDialog from './TakeoffAreaSetupDialog';

/**
 * Panel that shows the widgets that are needed to load and configure a drone
 * show.
 */
const ShowControlPanel = () => (
  <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
    <ShowControlPanelUpperSegment />

    {hasFeature('loadShowFromCloud') && <LoadShowFromCloudDialog />}
    <EnvironmentEditorDialog />
    <StartTimeDialog />
    <TakeoffAreaSetupDialog />
    <OnboardPreflightChecksDialog />
    <ManualPreflightChecksDialog />
  </Box>
);

export default ShowControlPanel;
