import { isNil, reject } from 'lodash'
import Collection from 'ol/collection'
import { createSelector } from 'reselect'

import {
  globalIdToFeatureId,
  globalIdToHomePositionId,
  globalIdToUavId
} from './model/identifiers'
import { isLayerVisible } from './model/layers'

import { selectOrdered } from './utils/collections'
import { isLocalHost } from './utils/networking'

/**
 * Selector that retrieves the list of item IDs in the current selection
 * from the state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected item IDs
 */
export const getSelection = state => state.map.selection

/**
 * Helper function that creates a selector that maps the current map selection
 * to a subset of the IDs based on a mapping function from global IDs.
 *
 * @param {function} mapper  a function that takes a global ID as an input
 *        argument and returns null or undefined if and only if the global ID
 *        is not part of the subset being selected
 * @return {function} a selector function
 */
const selectionForSubset = mapper => createSelector(
  getSelection, selection => reject(selection.map(mapper), isNil)
)

/**
 * Selector that retrieves the list of selected feature IDs from the
 * state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected feature IDs
 */
export const getSelectedFeatureIds = selectionForSubset(globalIdToFeatureId)

const _selectedFeatureIdsCollection = new Collection([], { unique: true })

/**
 * Selector that retrieves an OpenLayers collection containing the list of
 * selected feature IDs from the state object.
 *
 * The selector will always return the *same* OpenLayers collection instance,
 * but it will update the contents of the collection when the selection
 * changes. It is the responsibility of components using this collection
 * to listen for the appropriate events dispatched by the collection.
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected feature IDs
 */
export const getSelectedFeatureIdsAsOpenLayersCollection = createSelector(
  getSelection,
  selection => {
    _selectedFeatureIdsCollection.clear()
    _selectedFeatureIdsCollection.extend(selection)
    return _selectedFeatureIdsCollection
  }
)

/**
 * Selector that retrieves the list of the labels of the selected features
 * from the state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected feature labels
 */
export const getSelectedFeatureLabels = createSelector(
  getSelectedFeatureIds,
  state => state.features.byId,
  (featureIds, features) => (
    reject(
      featureIds.map(featureId => features[featureId]), isNil
    ).map(feature => feature.label)
  )
)

/**
 * Selector that retrieves the list of selected home position IDs from the
 * state object.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of selected feature IDs
 */
export const getSelectedHomePositionIds = selectionForSubset(globalIdToHomePositionId)

/**
 * Selector that calculates and caches the list of selected UAV IDs from
 * the state object.
 */
export const getSelectedUAVIds = selectionForSubset(globalIdToUavId)

/**
 * Selector that calculates and caches the list of all the servers detected
 * on the local network, in exactly the same order as they should appear on
 * the UI.
 */
export const getDetectedServersInOrder = createSelector(
  state => state.servers,
  selectOrdered
)

/**
 * Selector that calculates and caches the list of all the connections that
 * the upstream server maintains to its auxiliary devices, in exactly the
 * same order as they should appear on the UI.
 */
export const getConnectionsInOrder = createSelector(
  state => state.connections,
  selectOrdered
)

/**
 * Selector that calculates and caches the list of all the features in the
 * state object, in exactly the same order as they should appear on the UI.
 */
export const getFeaturesInOrder = createSelector(
  state => state.features,
  selectOrdered
)

/**
 * Selector that calculates and caches the list of all the layers in the
 * state object, in exactly the same order as they should appear on the UI.
 */
export const getLayersInOrder = createSelector(
  state => state.map.layers,
  selectOrdered
)

/**
 * Selector that calculates and caches the list of visible layers in the
 * state object, in exactly the same order as they should appear on the UI.
 */
export const getVisibleLayersInOrder = createSelector(
  getLayersInOrder,
  layers => layers.filter(isLayerVisible)
)

/**
 * Selector that calculates and caches the list of all the saved locations
 * in the state object, in exactly the same order as they should appear on
 * the UI.
 */
export const getSavedLocationsInOrder = createSelector(
  state => state.savedLocations,
  selectOrdered
)

/**
 * Returns the list of directories in which a local Flockwave server instance
 * will be searched, besides the standard system path.
 *
 * @param  {Object}  state  the state of the application
 * @return {string[]}  the list of directories to add to the system path
 */
export const getLocalServerSearchPath =
  state => state.settings.localServer.searchPath

/**
 * Returns the full path to the executable of a local Flockwave server.
 *
 * @param  {Object}  state  the state of the application
 * @return {string|undefined}  the full path
 */
export const getLocalServerExecutable =
  state => state.localServer.pathScan.result

/**
 * Returns whether a local Flockwave server launched directly by the Flockwave
 * desktop app should be running in the background.
 */
export const shouldManageLocalServer = createSelector(
  state => state.dialogs.serverSettings,
  state => state.settings.localServer,
  (serverSettings, localServer) => (
    window.bridge && window.bridge.launchServer &&
    localServer.enabled &&
    isLocalHost(serverSettings.hostName) &&
    serverSettings.active
  )
)
