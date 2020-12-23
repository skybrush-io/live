import { connect } from 'react-redux';

import { getTrajectoryPointsInFlatEarthCoordinatesByUavId } from '~/features/uavs/selectors';

import Trajectory from './Trajectory';

export default connect(
  // mapStateToProps
  (state, { uavId }) => ({
    points: uavId
      ? getTrajectoryPointsInFlatEarthCoordinatesByUavId(state, uavId)
      : [],
  })
)(Trajectory);
