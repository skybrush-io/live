import { connect } from 'react-redux';

import { getFlatEarthHomePositionsInMission } from '~/features/three-d/selectors';

import Markers from './Markers';

export default connect(
  // mapStateToProps
  (state) => ({
    coordinates: getFlatEarthHomePositionsInMission(state),
    mixin: 'takeoff-marker',
  }),
  // mapDispatchToProps
  {}
)(Markers);
