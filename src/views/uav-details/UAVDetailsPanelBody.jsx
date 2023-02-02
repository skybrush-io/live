import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';

import MessagesPanel from '~/components/chat/MessagesPanel';
import PreflightStatusPanel from '~/features/uavs/PreflightStatusPanel';
import {
  getSelectedTabInUAVDetailsPanel,
  getSelectedUAVIdInUAVDetailsPanel,
} from '~/features/uavs/selectors';
import UAVTestsPanel from '~/features/uavs/UAVTestsPanel';

export const views = {
  preflight: PreflightStatusPanel,
  tests: UAVTestsPanel,
  messages: MessagesPanel,
};

// prettier-ignore
const UAVDetailsPanelBody = ({ selectedTab, uavId }) =>
  !uavId                  ? <BackgroundHint text='Please select a UAV id!' />  :
  !(selectedTab in views) ? <BackgroundHint text='Please select a view!'   />  :
  ((SelectedView)        => <SelectedView uavId={uavId} />)(views[selectedTab]);

UAVDetailsPanelBody.propTypes = {
  selectedTab: PropTypes.oneOf(Object.keys(views)),
  uavId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    selectedTab: getSelectedTabInUAVDetailsPanel(state),
    uavId: getSelectedUAVIdInUAVDetailsPanel(state),
  })
)(UAVDetailsPanelBody);
