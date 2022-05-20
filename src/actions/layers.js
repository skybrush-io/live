/**
 * @file Action factories related to the dialog that shows the layer
 * configuration of the map.
 */

import { actions } from '../reducers/map/layers';

export const {
  addLayer,
  adjustLayerZIndex,
  changeLayerType,
  removeLayer,
  renameLayer,
  selectMapSource,
  setLayerParameterById,
  setLayerParametersById,
  toggleLayerVisibility,
} = actions;
