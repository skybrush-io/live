import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Tab from '@material-ui/core/Tab';

import DialogTabs from '~/components/dialogs/DialogTabs';

import { setSelectedTabInUAVDetailsDialog } from './details';

/**
 * Presentation component for the dialog that allows the user to inspect the
 * details of a specific UAV.
 */
const UAVDetailsDialogTabs = ({ dragHandleId, ...rest }) => (
  <DialogTabs alignment='left' dragHandle={dragHandleId} {...rest}>
    <Tab label='Status' value='status' />
    <Tab label='Tests' value='tests' />
    <Tab label='Messages' value='messages' />
  </DialogTabs>
);

UAVDetailsDialogTabs.propTypes = {
  dragHandleId: PropTypes.string,
  value: PropTypes.string,
};

UAVDetailsDialogTabs.defaultProps = {
  value: 'status',
};

export default connect(
  // mapStateToProps
  (state) => ({
    value: state.dialogs.uavDetails.selectedTab,
  }),

  // mapDispatchToProps
  {
    onChange: (_event, value) => setSelectedTabInUAVDetailsDialog(value),
  }
)(UAVDetailsDialogTabs);
