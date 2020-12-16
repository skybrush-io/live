import React from 'react';
import { connect } from 'react-redux';

import { getSelectedUAVIdsForTrajectoryDisplay } from '~/selectors/selection';

import UAVTrajectory from './UAVTrajectory';

const Trajectories = ({ uavIds }) =>
  uavIds.map((uavId) => <UAVTrajectory key={uavId} uavId={uavId} />);

export default connect(
  // mapStateToProps
  (state) => ({
    uavIds: getSelectedUAVIdsForTrajectoryDisplay(state),
  }),
  // mapDispatchToProps
  {}
)(Trajectories);
