import { connect } from 'react-redux';

import { DocksLayer as DocksLayerPresentation } from '~/components/map/layers/docks';
import {
  getDocksInOrder,
  getSelectedDockIds,
} from '~/features/docks/selectors';
import type { RootState } from '~/store/reducers';

// import DockImage from '~/../assets/img/dock-32x32.png';

export const DocksLayer = connect(
  // mapStateToProps
  (state: RootState) => ({
    docks: getDocksInOrder(state),
    selectedDockIds: getSelectedDockIds(state),
  }),
  // mapDispatchToProps
  null
)(DocksLayerPresentation);
