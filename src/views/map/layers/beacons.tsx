import { connect } from 'react-redux';

import { BeaconsLayer as BeaconsLayerPresentation } from '~/components/map/layers/beacons';
import {
  getBeaconsInOrder,
  getSelectedBeaconIds,
} from '~/features/beacons/selectors';
import type { RootState } from '~/store/reducers';

export const BeaconsLayer = connect(
  // mapStateToProps
  (state: RootState) => ({
    beacons: getBeaconsInOrder(state),
    selectedBeaconIds: getSelectedBeaconIds(state),
  }),
  // mapDispatchToProps
  null
)(BeaconsLayerPresentation);
