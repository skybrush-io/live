import { connect } from 'react-redux';

import { getMapViewRotationAngle } from '~/selectors/map';

import MapToolbar from '~/components/map/MapToolbar';
import type { RootState } from '~/store/reducers';

/**
 * Main toolbar on the map.
 */
const ConnectedMapToolbar = connect(
  // mapStateToProps
  (state: RootState) => ({
    initialRotation: getMapViewRotationAngle(state),
  }),
  // mapDispatchToProps
  null
)(MapToolbar);
export default ConnectedMapToolbar;
