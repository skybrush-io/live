import { connect } from 'react-redux';

import { getHomePositionsInMissionForThreeDView } from '~/features/three-d/selectors';

import Markers from './Markers';

export default connect(
  // mapStateToProps
  (state) => ({
    coordinates: getHomePositionsInMissionForThreeDView(state),
    mixin: 'takeoff-marker',
  }),
  // mapDispatchToProps
  {}
)(Markers);
