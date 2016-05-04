/**
 * @file The master store for the application state.
 */

import { createStore } from 'redux';
import masterReducer from './reducers';

/**
 * The store for the application state.
 */
const store = createStore(
    masterReducer, undefined,
    window.devToolsExtension ? window.devToolsExtension() : undefined
);
export default store;
