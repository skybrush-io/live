/**
 * @file Reducer function for handling the part of the state object that
 * stores the state of the map, its selection, the list of layers and so
 * on.
 */

import { combineReducers } from '@reduxjs/toolkit';

import layersReducer from './layers';
import originReducer from './origin';
import selectionReducer from './selection';
import toolsReducer from './tools';
import viewReducer from './view';

/**
 * The reducer function that is responsible for handling all map-related
 * parts in the global state object.
 */
const reducer = combineReducers({
  layers: layersReducer,
  origin: originReducer,
  selection: selectionReducer,
  tools: toolsReducer,
  view: viewReducer,
});

export default reducer;
