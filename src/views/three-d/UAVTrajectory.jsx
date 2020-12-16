import { connect } from 'react-redux';

import { getTrajectoryPointsInShowCoordinatesByUavId } from '~/features/uavs/selectors';

import Trajectory from './Trajectory';

export default connect(
  // mapStateToProps
  (state, { uavId }) => ({
    points: uavId
      ? getTrajectoryPointsInShowCoordinatesByUavId(state, uavId)
      : [],
  })
)(Trajectory);
