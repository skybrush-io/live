/**
 * @file The master store for the application state.
 */

import { createStore } from 'redux'
import reducer from './reducers'

/**
 * The store for the application state.
 */
const store = createStore(
    reducer, undefined,
    window.devToolsExtension ? window.devToolsExtension() : undefined
)
export default store
