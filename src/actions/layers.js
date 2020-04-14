/**
 * @file Action factories related to the dialog that shows the layer
 * configuration of the map.
 */

import { createAction } from 'redux-actions';
import {
  SHOW_LAYERS_DIALOG,
  CLOSE_LAYERS_DIALOG,
  TOGGLE_LAYER_VISIBILITY,
  RENAME_LAYER,
  REMOVE_LAYER,
  ADD_LAYER,
  CHANGE_LAYER_TYPE,
  SET_LAYER_PARAMETER_BY_ID,
  SET_LAYER_PARAMETERS_BY_ID,
  ADJUST_LAYER_Z_INDEX,
} from './types';

/**
 * Action factory that creates an action that adds a new (typed or untyped)
 * layer.
 *
 * @param {string?} name  the name of the layer to add; when omitted, a
 *        name will be generated automatically
 * @param {string?} type  the type of the layer to add; when omitted, the
 *        layer will be untyped and the user will be given an option to
 *        change its type
 */
export const addLayer = createAction(ADD_LAYER, (name, type) => ({
  name,
  type,
}));

/**
 * Action factory that creates an action that will adjust the z-index of
 * the layer with the given amount. Positive values will bring the layer
 * to the front; negative values will bring the layer to the back.
 */
export const adjustLayerZIndex = createAction(
  ADJUST_LAYER_Z_INDEX,
  (id, delta) => ({ id, delta })
);

/**
 * Action factory that changes the type of a currently untyped layer.
 *
 * Changing the type of a layer whose type is not <code>LayerType.UNTYPED</code>
 * is not supported at the moment. Trying to do so will yield an error.
 *
 * @param {string?} id    the ID of the layer whose type is to be changed
 * @param {string}  type  the new type of the layer
 */
export const changeLayerType = createAction(CHANGE_LAYER_TYPE, (id, type) => ({
  id,
  type,
}));

/**
 * Action factory that creates an action that will close the layers dialog.
 */
export const closeLayersDialog = createAction(CLOSE_LAYERS_DIALOG);

/**
 * Action factory that creates an action that removes a layer.
 */
export const removeLayer = createAction(REMOVE_LAYER);

/**
 * Action factory that creates an action that renames a layer.
 *
 * @param {string} id    the ID of the layer to rename
 * @param {string} name  the new name of the layer
 */
export const renameLayer = createAction(RENAME_LAYER, (id, name) => ({
  id,
  name,
}));

/**
 * Action factory that sets a chosen parameter of the layer specified by the id.
 *
 * @param {string} id the ID of the layer whose parameter is to be changed
 * @param {string} parameter the parameter to change
 * @param {string} value the new value of the parameter
 */
export const setLayerParameterById = createAction(
  SET_LAYER_PARAMETER_BY_ID,
  (layerId, parameter, value) => ({ layerId, parameter, value })
);

/**
 * Action factory that sets multiple parameters of the layer specified by the id.
 *
 * @param {string} id the ID of the layer whose parameter is to be changed
 * @param {object} parameters the parameter to change
 */
export const setLayerParametersById = createAction(
  SET_LAYER_PARAMETERS_BY_ID,
  (layerId, parameters) => ({ layerId, parameters })
);

/**
 * Action factory that creates an action that will show the layers dialog.
 */
export const showLayersDialog = createAction(SHOW_LAYERS_DIALOG, (layerId) => ({
  layerId,
}));

/**
 * Action factory that creates an action that toggles the visibility of a
 * layer with the given ID.
 *
 * @param {string} layerId  the ID of the layer whose visibility is to be
 *        modified
 */
export const toggleLayerVisibility = createAction(TOGGLE_LAYER_VISIBILITY);
