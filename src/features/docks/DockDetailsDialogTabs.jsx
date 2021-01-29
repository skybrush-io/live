import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Tab from '@material-ui/core/Tab';

import DialogTabs from '~/components/dialogs/DialogTabs';

import {
  getSelectedTabInDockDetailsDialog,
  setSelectedTabInDockDetailsDialog,
} from './details';

/**
 * Presentation component for the dialog that allows the user to inspect the
 * details of a specific docking station.
 */
const DockDetailsDialogTabs = ({ dragHandleId, ...rest }) => (
  <DialogTabs alignment='left' dragHandle={dragHandleId} {...rest}>
    <Tab label='Landing pads' value='landingPads' />
    <Tab label='Sensors' value='sensors' />
    <Tab label='Schedule' value='schedule' />
    <Tab label='Live cam' value='liveCam' />
  </DialogTabs>
);

DockDetailsDialogTabs.propTypes = {
  dragHandleId: PropTypes.string,
  value: PropTypes.string,
};

DockDetailsDialogTabs.defaultProps = {
  value: 'landingPads',
};

export default connect(
  // mapStateToProps
  (state) => ({
    value: getSelectedTabInDockDetailsDialog(state),
  }),

  // mapDispatchToProps
  {
    onChange: (_event, value) => setSelectedTabInDockDetailsDialog(value),
  }
)(DockDetailsDialogTabs);
