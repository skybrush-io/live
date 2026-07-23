import { connect } from 'react-redux';

import { getSelectedUAVIdsForTrajectoryDisplay } from '~/features/uavs/selectors';
import type { RootState } from '~/store/reducers';

import UAVTrajectory from './UAVTrajectory';

type Props = {
  uavIds: string[];
};

const Trajectories = ({ uavIds }: Props) =>
  uavIds.map((uavId) => <UAVTrajectory key={uavId} uavId={uavId} />);

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    uavIds: getSelectedUAVIdsForTrajectoryDisplay(state),
  }),
  // mapDispatchToProps
  {}
)(Trajectories);
