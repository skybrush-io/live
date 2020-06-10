import React from 'react';

import Box from '@material-ui/core/Box';
import List from '@material-ui/core/List';

import AuthorizationButton from './AuthorizationButton';
import EnvironmentEditorDialog from './EnvironmentEditorDialog';
import LoadShowFromCloudDialog from './LoadShowFromCloudDialog';
import ManualPreflightChecksDialog from './ManualPreflightChecksDialog';
import OnboardPreflightChecksDialog from './OnboardPreflightChecksDialog';
import ShowControlPanelUpperSegment from './ShowControlPanelUpperSegment';
import StartTimeDialog from './StartTimeDialog';
import TakeoffAreaSetupDialog from './TakeoffAreaSetupDialog';
import UploadDialog from './UploadDialog';

/**
 * Panel that shows the widgets that are needed to load and configure a drone
 * show.
 */
const ShowControlPanel = () => (
  <Box
    display='flex'
    flexDirection='column'
    height='100%'
    id='tour-show-control'
  >
    <ShowControlPanelUpperSegment />

    <Box className='bottom-bar'>
      <List dense disablePadding>
        <AuthorizationButton />
      </List>
    </Box>

    <LoadShowFromCloudDialog />
    <EnvironmentEditorDialog />
    <StartTimeDialog />
    <TakeoffAreaSetupDialog />
    <UploadDialog />
    <OnboardPreflightChecksDialog />
    <ManualPreflightChecksDialog />
  </Box>
);

export default ShowControlPanel;
