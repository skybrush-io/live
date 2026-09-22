import { connect } from 'react-redux';

import { setLayerParametersById } from '~/features/map/layers';

import { TileServerLayerSettings as TileServerLayerSettingsPresentation } from './presentation';

export const TileServerLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    changeTileServerType(event) {
      dispatch(
        setLayerParametersById(ownProps.layerId, {
          type: event.target.value,
        })
      );
    },
    setLayerParameters(parameters) {
      dispatch(setLayerParametersById(ownProps.layerId, parameters));
    },
  })
)(TileServerLayerSettingsPresentation);
