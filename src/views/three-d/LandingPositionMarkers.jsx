import { connect } from 'react-redux';

import { getLandingPositionsInMissionForThreeDView } from '~/features/three-d/selectors';

import Markers from './Markers';

export default connect(
  // mapStateToProps
  (state) => ({
    coordinates: getLandingPositionsInMissionForThreeDView(state),
    mixin: 'landing-marker',
  }),
  // mapDispatchToProps
  {}
)(Markers);
