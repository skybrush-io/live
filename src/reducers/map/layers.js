/**
 * @file Reducer function for handling the selected base layer on the map.
 */

import { handleActions } from 'redux-actions'

/**
 * The default selected base layer.
 */
const defaultState = {
  visibleSource: 'osm'
}

/**
 * The reducer function that handles actions related to the tool selection.
 */
const reducer = handleActions({
  SELECT_MAP_SOURCE (state, action) {
    return Object.assign({}, state, {
      visibleSource: action.payload
    })
  }
}, defaultState)

export default reducer
