import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import MessagesPanel from '~/components/chat/MessagesPanel';

import PreflightStatusPanel from './PreflightStatusPanel';

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

    default:
      return null;
  }
};

UAVDetailsDialogBody.propTypes = {
  selectedTab: PropTypes.oneOf(['messages', 'preflight', 'tests']),
  uavId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    selectedTab: getSelectedTabInUAVDetailsDialog(state),
    uavId: getSelectedUAVIdInUAVDetailsDialog(state),
  })
)(UAVDetailsDialogBody);
