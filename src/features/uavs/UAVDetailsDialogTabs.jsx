import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Tab from '@material-ui/core/Tab';

import DialogTabs from '@skybrush/mui-components/lib/DialogTabs';

import {
  getSelectedTabInUAVDetailsDialog,
  setSelectedTabInUAVDetailsDialog,
} from './details';

/**
 * Presentation component for the dialog that allows the user to inspect the
 * details of a specific UAV.
 */
const UAVDetailsDialogTabs = ({ dragHandleId, ...rest }) => (
  <DialogTabs alignment='left' dragHandle={dragHandleId} {...rest}>
    <Tab label='Preflight' value='preflight' />
    <Tab label='Tests' value='tests' />
    <Tab label='Messages' value='messages' />
    <Tab label='Logs' value='logs' />
  </DialogTabs>
);

UAVDetailsDialogTabs.propTypes = {
  dragHandleId: PropTypes.string,
  value: PropTypes.string,
};

UAVDetailsDialogTabs.defaultProps = {
  value: 'preflight',
};

export default connect(
  // mapStateToProps
  (state) => ({
    value: getSelectedTabInUAVDetailsDialog(state),
  }),

  // mapDispatchToProps
  {
    onChange: (_event, value) => setSelectedTabInUAVDetailsDialog(value),
  }
)(UAVDetailsDialogTabs);
