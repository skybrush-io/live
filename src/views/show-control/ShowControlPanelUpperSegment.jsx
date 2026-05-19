import Box from '@mui/material/Box';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { getShowEnvironmentType } from '~/features/show/selectors';

import AuthorizationButton from './AuthorizationButton';
import EnvironmentButton from './EnvironmentButton';
import GeofenceButton from './GeofenceButton';
import LoadShowFromFileButton from './LoadShowFromFileButton';
import ManualPreflightChecksButton from './ManualPreflightChecksButton';
import OnboardPreflightChecksButton from './OnboardPreflightChecksButton';
import ShowUploadDialogButton from './ShowUploadDialogButton';
import ShowConfiguratorButton from './ShowConfiguratorButton';
import StartMethodExplanation from './StartMethodExplanation';
import StartTimeButton from './StartTimeButton';
import TakeoffAreaButton from './TakeoffAreaButton';

/**
 * Panel that shows the widgets that are needed to load and configure a drone
 * show.
 */
const ShowControlPanelUpperSegment = ({ environmentType }) => (
  <Box flex={1} sx={{ overflow: 'auto' }}>
    <List dense>
      <LoadShowFromFileButton />

      <Divider />

      <EnvironmentButton />
      {environmentType === 'outdoor' && <ShowConfiguratorButton />}
      <TakeoffAreaButton />
      {environmentType === 'outdoor' && <GeofenceButton />}
      <ShowUploadDialogButton />

      <Divider />

      <OnboardPreflightChecksButton />
      <ManualPreflightChecksButton />

      <Divider />

      <StartTimeButton />
      <StartMethodExplanation />
      <AuthorizationButton />
    </List>
  </Box>
);

ShowControlPanelUpperSegment.propTypes = {
  environmentType: PropTypes.oneOf(['indoor', 'outdoor']),
};

export default connect(
  // mapStateToProps
  (state) => ({
    environmentType: getShowEnvironmentType(state),
    filename: null,
  })
)(ShowControlPanelUpperSegment);
