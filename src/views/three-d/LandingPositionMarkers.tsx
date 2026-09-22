import { connect } from 'react-redux';

import { getLandingPositionsInMissionForThreeDView } from '~/features/three-d/selectors';
import type { RootState } from '~/store/reducers';

import Markers from './Markers';

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    coordinates: getLandingPositionsInMissionForThreeDView(state),
    mixin: 'landing-marker',
  }),
  // mapDispatchToProps
  {}
)(Markers);
