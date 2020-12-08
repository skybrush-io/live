import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';

import DroneAvatar from '~/components/uavs/DroneAvatar';

/**
 * Sidebar of the UAV details dialog.
 */
const UAVDetailsDialogSidebar = ({ uavId }) => (
  <Box p={2}>
    <DroneAvatar id={uavId} />
  </Box>
);

UAVDetailsDialogSidebar.propTypes = {
  uavId: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state) => ({
    uavId: state.dialogs.uavDetails.selectedUAVId,
  }),
  // mapDispatchToProps
  {}
)(UAVDetailsDialogSidebar);
