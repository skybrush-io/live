/**
 * @file Action factories related to the dialog that shows the layer
 * configuration of the map.
 */

import { createAction } from 'redux-actions'
import { SET_SELECTED_LAYER_IN_LAYERS_DIALOG, SHOW_LAYERS_DIALOG,
  CLOSE_LAYERS_DIALOG, TOGGLE_LAYER_VISIBILITY, RENAME_LAYER,
  REMOVE_LAYER } from './types'

/**
 * Action factory that creates an action that will close the layers dialog.
 */
export const closeLayersDialog = createAction(CLOSE_LAYERS_DIALOG)

/**
 * Action factory that creates an action that removes a layer.
 */
export const removeLayer = createAction(REMOVE_LAYER)

/**
 * Action factory that creates an action that renames a layer.
 *
 * @param {string} layerId  the ID of the layer to rename
 * @param {string} name     the new name of the layer
 */
export const renameLayer = createAction(RENAME_LAYER,
  (layerId, name) => ({
    id: layerId, name: name
  })
)

/**
 * Action factory that creates an action that will set the selected layer
 * in the layers dialog.
 *
 * @param {string} layerId  the ID of the layer to select
 */
export const setSelectedLayerInLayersDialog = createAction(
  SET_SELECTED_LAYER_IN_LAYERS_DIALOG)

/**
 * Action factory that creates an action that will show the layers dialog.
 */
export const showLayersDialog = createAction(SHOW_LAYERS_DIALOG)

/**
 * Action factory that creates an action that toggles the visibility of a
 * layer with the given ID.
 *
 * @param {string} layerId  the ID of the layer whose visibility is to be
 *        modified
 */
export const toggleLayerVisibility = createAction(TOGGLE_LAYER_VISIBILITY)
