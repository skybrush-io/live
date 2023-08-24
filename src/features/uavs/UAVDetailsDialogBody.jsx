import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import MessagesPanel from '~/components/chat/MessagesPanel';

import PreflightStatusPanel from './PreflightStatusPanel';
import UAVLogsPanel from './UAVLogsPanel';
import UAVTestsPanel from './UAVTestsPanel';

import {
  getSelectedTabInUAVDetailsDialog,
  getSelectedUAVIdInUAVDetailsDialog,
} from './details';

const UAVDetailsDialogBody = ({ selectedTab, uavId }) => {
  switch (selectedTab) {
    case 'messages':
      return <MessagesPanel uavId={uavId} />;

    case 'preflight':
      return <PreflightStatusPanel uavId={uavId} />;

    case 'tests':
      return <UAVTestsPanel uavId={uavId} />;

    case 'logs':
      return <UAVLogsPanel uavId={uavId} />;

    default:
      return null;
  }
};

UAVDetailsDialogBody.propTypes = {
  selectedTab: PropTypes.oneOf(['messages', 'preflight', 'tests', 'logs']),
  uavId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    selectedTab: getSelectedTabInUAVDetailsDialog(state),
    uavId: getSelectedUAVIdInUAVDetailsDialog(state),
  })
)(UAVDetailsDialogBody);
