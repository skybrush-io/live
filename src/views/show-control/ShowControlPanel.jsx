import React from 'react';

import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';

import AuthorizationButton from './AuthorizationButton';
import EnvironmentButton from './EnvironmentButton';
import EnvironmentEditorDialog from './EnvironmentEditorDialog';
import LoadShowFromFileButton from './LoadShowFromFileButton';
import ManualPreflightChecksButton from './ManualPreflightChecksButton';
import ManualPreflightChecksDialog from './ManualPreflightChecksDialog';
import OnboardPreflightChecksButton from './OnboardPreflightChecksButton';
import OnboardPreflightChecksDialog from './OnboardPreflightChecksDialog';
import StartTimeButton from './StartTimeButton';
import StartTimeDialog from './StartTimeDialog';
import TakeoffAreaButton from './TakeoffAreaButton';
import TakeoffAreaSetupDialog from './TakeoffAreaSetupDialog';
import UploadButton from './UploadButton';
import UploadDialog from './UploadDialog';

/**
 * Panel that shows the widgets that are needed to load and configure a drone
 * show.
 */
const ShowControlPanel = () => {
  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box style={{ overflow: 'auto' }} flex={1}>
        <List dense>
          <LoadShowFromFileButton />
          <Divider />
          <EnvironmentButton />
          <TakeoffAreaButton />
          <Divider />
          <UploadButton />
          <StartTimeButton />
          <Divider />
          <OnboardPreflightChecksButton />
          <ManualPreflightChecksButton />
        </List>
      </Box>

      <Box className="bottom-bar">
        <List dense disablePadding>
          <AuthorizationButton />
        </List>
      </Box>

      <EnvironmentEditorDialog />
      <StartTimeDialog />
      <TakeoffAreaSetupDialog />
      <UploadDialog />
      <OnboardPreflightChecksDialog />
      <ManualPreflightChecksDialog />
    </Box>
  );
};

ShowControlPanel.propTypes = {};

export default ShowControlPanel;
