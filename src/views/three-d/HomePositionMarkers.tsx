import { connect } from 'react-redux';

import { getHomePositionsInMissionForThreeDView } from '~/features/three-d/selectors';
import type { RootState } from '~/store/reducers';

import Markers from './Markers';

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    coordinates: getHomePositionsInMissionForThreeDView(state),
    mixin: 'takeoff-marker',
  }),
  // mapDispatchToProps
  {}
)(Markers);
