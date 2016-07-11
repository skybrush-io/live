/**
 * @file Action factories related to the dialog that shows the layer
 * configuration of the map.
 */

import { createAction } from 'redux-actions'
import { SET_SELECTED_LAYER_IN_LAYERS_DIALOG, SHOW_LAYERS_DIALOG,
  CLOSE_LAYERS_DIALOG } from './types'

/**
 * Action factory that creates an action that will close the layers dialog.
 */
export const closeLayersDialog = createAction(CLOSE_LAYERS_DIALOG)

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
