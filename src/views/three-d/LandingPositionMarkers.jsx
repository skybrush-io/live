import { connect } from 'react-redux';

import { getFlatEarthLandingPositionsInMission } from '~/features/three-d/selectors';

import Markers from './Markers';

export default connect(
  // mapStateToProps
  state => ({
    coordinates: getFlatEarthLandingPositionsInMission(state),
    mixin: 'landing-marker'
  }),
  // mapDispatchToProps
  {}
)(Markers);
