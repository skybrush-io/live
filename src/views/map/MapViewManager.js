/**
 * @file Class for handling various parameters of an openlayers map's view.
 * (position, rotation, zoom)
 */

import { isEmpty } from 'ol/extent'
import { round } from 'lodash'

import {
  mapReferenceRequestSignal,
  mapViewToLocationSignal,
  mapViewToExtentSignal
} from '~/signals'
import { coordinateFromLonLat, lonLatFromCoordinate } from '~/utils/geography'

import { normalizeAngle } from './MapRotationTextBox.jsx'

/**
 * Class for handling various parameters of an OpenLayers map's view.
 * (center, rotation, zoom)
 */
export default class MapViewManager {
  /**
   * Constructor that binds member functions and adds listener.
   */
  constructor () {
    this.initialize = this.initialize.bind(this)
    this.mapViewToLocation = this.mapViewToLocation.bind(this)
    this.mapViewToExtent = this.mapViewToExtent.bind(this)
    this.onMapReferenceReceived = this.onMapReferenceReceived.bind(this)
    this.viewListener = this.viewListener.bind(this)
    this.addListener = this.addListener.bind(this)
    this.removeListener = this.removeListener.bind(this)

    this.callbacks = {
      center: [],
      rotation: [],
      zoom: []
    }

    mapViewToLocationSignal.add(this.mapViewToLocation)
    mapViewToExtentSignal.add(this.mapViewToExtent)
  }

  /**
   * Initializer function that requests the map reference.
   */
  initialize () {
    mapReferenceRequestSignal.dispatch(this.onMapReferenceReceived)
  }

  /**
   * Callback for receiving the map reference.
   * Attaches event handlers to the map and it's view.
   *
   * @param {ol.Map} map the map to attach the event handlers to.
   */
  onMapReferenceReceived (map) {
    this.map = map

    this.view = map.getView()
    this.view.on('propertychange', this.viewListener)

    // map.getView().on('propertychange', this.updateFromMap_)

    map.on('propertychange', (e) => {
      if (e.key === 'view') {
        this.view.un('propertychange', this.viewListener)
        this.view = map.getView()
        this.view.on('propertychange', this.viewListener)
      }
    })
  }

  /**
   * Listener function for running the appropriate callback functions when a
   * property changes on the connected view.
   *
   * @param {ol.ObjectEvent} e the propertychange event emitted by openlayers.
   */
  viewListener (e) {
    if (e.key === 'center') {
      const center = lonLatFromCoordinate(this.view.getCenter()).map(
        c => round(c, 6)
      )
      this.callbacks.center.forEach(c => c({ lon: center[0], lat: center[1] }))
    } else if (e.key === 'rotation') {
      const rotation = this.view.getRotation() * (180 / -Math.PI)
      this.callbacks.rotation.forEach(c => c(normalizeAngle(rotation)))
    } else if (e.key === 'resolution') {
      const zoom = this.view.getZoom()
      this.callbacks.zoom.forEach(c => c(zoom))
    }
  }

  /**
   * Method for attaching an event listener to the change of
   * a specific property.
   *
   * @param {string} property the property to attach the callback to.
   * @param {function} callback the function to run when the given
   * property changes.
   */
  addListener (property, callback) {
    if (!(property in this.callbacks)) {
      throw new Error(`Cannot add listener to unknown property: ${property}.`)
    }

    // Avoiding push to prevent mutation by side effects
    this.callbacks[property] = this.callbacks[property].concat(callback)
  }

  /**
   * Method for removing an event listener from the change of a property.
   *
   * @param {string} property the property to remove the callback from.
   * @param {function} callback the function to remove.
   */
  removeListener (property, callback) {
    if (!(property in this.callbacks)) {
      throw new Error(
        `Cannot remove listener from unknown property: ${property}.`
      )
    }

    if (!this.callbacks[property].includes(callback)) {
      throw new Error(
        'Cannot remove event listener that has not yet been added.'
      )
    }

    // Avoiding splice to prevent mutation by side effects
    this.callbacks[property] = this.callbacks[property].filter(
      c => c !== callback
    )
  }

  /**
   * Jump to a specific location on the map's view.
   *
   * @param {Object} location The location descriptor to jump to.
   * @param {number} duration The desired duration of the transition.
   */
  mapViewToLocation (location, duration = 1000) {
    const { center, rotation, zoom } = location
    const animationParams = { duration }

    if (center !== undefined) {
      animationParams.center = coordinateFromLonLat([center.lon, center.lat])
    }

    if (rotation !== undefined) {
      animationParams.rotation = rotation / (180 / -Math.PI)
    }

    if (zoom !== undefined) {
      animationParams.zoom = zoom
    }

    this.view.animate(animationParams)
  }

  /**
   * Make the map's view fit a given extent.
   *
   * @param {Object} extent The extent to fit.
   * @param {number} duration The desired duration of the transition.
   */
  mapViewToExtent (extent, duration = 1000) {
    if (isEmpty(extent)) {
      console.warn('Cannot fit empty extent')
    } else {
      this.view.fit(extent, { duration })
    }
  }
}
