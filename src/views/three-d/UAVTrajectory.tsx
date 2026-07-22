import { connect } from 'react-redux';

import { getTrajectoryPointsInFlatEarthCoordinatesByUavId } from '~/features/uavs/selectors';
import type { RootState } from '~/store/reducers';

import Trajectory from './Trajectory';

type OwnProps = {
  uavId?: string;
};

export default connect(
  // mapStateToProps
  (state: RootState, { uavId }: OwnProps) => ({
    points: uavId
      ? getTrajectoryPointsInFlatEarthCoordinatesByUavId(state, uavId)
      : [],
  })
)(Trajectory);
