import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Divider from '@material-ui/core/Divider';
import List from '@material-ui/core/List';

import MultiPagePanel, { Page } from '~/components/MultiPagePanel';
import {
  getShowEnvironmentType,
  isShowAuthorizedToStartLocally,
} from '~/features/show/selectors';

import EnvironmentButton from './EnvironmentButton';
import GeofenceButton from './GeofenceButton';
import LargeControlButtonGroup from './LargeControlButtonGroup';
import LoadShowFromFileButton from './LoadShowFromFileButton';
import ManualPreflightChecksButton from './ManualPreflightChecksButton';
import OnboardPreflightChecksButton from './OnboardPreflightChecksButton';
import ShowUploadDialogButton from './ShowUploadDialogButton';
import StartTimeButton from './StartTimeButton';
import TakeoffAreaButton from './TakeoffAreaButton';

/**
 * Panel that shows the widgets that are needed to load and configure a drone
 * show.
 */
const ShowControlPanelUpperSegment = ({ environmentType, isAuthorized }) => (
  <MultiPagePanel flex={1} selectedPage={isAuthorized ? 'execution' : 'setup'}>
    <Page scrollable id='setup'>
      <List dense>
        <LoadShowFromFileButton />

        <Divider />

        <EnvironmentButton />
        <TakeoffAreaButton />
        {environmentType === 'outdoor' && <GeofenceButton />}
        <ShowUploadDialogButton />

        <Divider />

        <OnboardPreflightChecksButton />
        <ManualPreflightChecksButton />

        <Divider />

        <StartTimeButton />
      </List>
    </Page>
    <Page scrollable id='execution' display='flex' flexDirection='column'>
      <LargeControlButtonGroup />
    </Page>
  </MultiPagePanel>
);

ShowControlPanelUpperSegment.propTypes = {
  environmentType: PropTypes.oneOf(['indoor', 'outdoor']),
  isAuthorized: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    environmentType: getShowEnvironmentType(state),
    filename: null,
    isAuthorized: isShowAuthorizedToStartLocally(state),
  })
)(ShowControlPanelUpperSegment);
