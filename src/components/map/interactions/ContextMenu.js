/**
 * @file OpenLayers interaction (for right click by default) that overwrites the
 * active selection if there is a not yet selected point feature of a layer that
 * is close enough to the point where the user clicked and triggers a context-menu.
 */

import _ from 'lodash'
import { interaction } from 'ol-react'
import ol from 'openlayers'
import PropTypes from 'prop-types'

import Condition from '../conditions'
import { euclideanDistance } from '../../../utils/geography'

/**
 * OpenLayers interaction (for right click by default) that overwrites the
 * active selection if there is a not yet selected point feature of a layer that
 * is close enough to the point where the user clicked and triggers a context-menu.
 */
class ContextMenuInteraction extends ol.interaction.Interaction {
  constructor (options = {}) {
    super({
      handleEvent: mapBrowserEvent => {
        // Check whether the event matches the condition
        if (!this._condition(mapBrowserEvent)) {
          return true
        }

        mapBrowserEvent.originalEvent.preventDefault()

        // Create the layer selector function if needed
        if (!this._layerSelectorFunction) {
          this._layerSelectorFunction = this._createLayerSelectorFunction(this._layers)
        }

        // Find the feature that is closest to the selection, in each
        // matching layer
        const { coordinate, map } = mapBrowserEvent
        const distanceFunction = _.partial(this._distanceOfEventFromFeature, mapBrowserEvent)
        const closestFeature = _(map.getLayers().getArray())
          .filter(this._isLayerFeasible)
          .filter(this._layerSelectorFunction)
          .map(layer => {
            const source = layer.getSource()
            return source
              ? source.getClosestFeatureToCoordinate(coordinate)
              : undefined
          })
          .filter(this._isFeatureFeasible)
          .minBy(distanceFunction)

        // Get the actual distance of the feature
        const distance = distanceFunction(closestFeature)

        // If the feature is close enough...
        if (distance <= this._threshold && !closestFeature.selected) {
          // Now call the callback
          this._select('set', closestFeature, distance)
        }

        // Trigger the actual context menu element
        this._contextMenu(mapBrowserEvent)

        return ol.events.condition.pointerMove(mapBrowserEvent)
      }
    })

    const defaultOptions = {
      condition: Condition.rightClick,
      threshold: Number.POSITIVE_INFINITY
    }
    options = Object.assign(defaultOptions, options)

    this._condition = options.condition
    this._select = options.select
    this._contextMenu = options.contextMenu
    this._threshold = options.threshold
    this.setLayers(options.layers)
  }

  /**
   * Constructs a layer selector function from the given object.
   *
   * @param {Array<ol.layer.Layer>|function(layer: ol.layer.Layer):boolean|undefined} layers
   *        the layer selector object; either an array of layers that should
   *        be included in the selection or a function that returns true
   *        for layers that should be included in the selection
   * @return {function(layer: ol.layer.Layer):boolean} an appropriate layer
   *         selector function
   */
  _createLayerSelectorFunction (layers) {
    if (layers) {
      if (_.isFunction(layers)) {
        return layers
      } else if (_.isArray(layers)) {
        return layer => _.includes(layers, layer)
      } else {
        return _.stubFalse
      }
    } else {
      return _.stubTrue
    }
  }

  /**
   * Calculates the distance of a given feature from a given map browser
   * event. The distance will be returned in pixels.
   *
   * @param {ol.MapBrowserEvent}  event    the event
   * @param {ol.Feature}          feature  the feature
   * @return {number} the distance of the feature from the event, in pixels
   */
  _distanceOfEventFromFeature (event, feature) {
    const closestPoint = feature.getGeometry().getClosestPoint(event.coordinate)
    const closestPixel = event.map.getPixelFromCoordinate(closestPoint)
    return euclideanDistance(event.pixel, closestPixel)
  }

  /**
   * Returns the associated layer selector of the interaction.
   *
   * @return {Array<ol.layer.Layer>|function(layer: ol.layer.Layer):boolean|undefined}
   *         the layer selector
   */
  getLayers () {
    return this._layers
  }

  /**
   * Returns whether a given layer is visible and has an associated vector
   * source.
   *
   * @param {ol.layer.Layer} layer  the layer to test
   * @return {boolean} whether the layer is visible and has an associated
   *         vector source
   */
  _isLayerFeasible (layer) {
    return layer && layer.getVisible() && layer instanceof ol.layer.Vector
  }

  /**
   * Sets the layer selector that defines which layers the interaction will
   * operate on.
   *
   * The layer selector may be a list of layers (i.e. {@link ol.layer.Layer}
   * objects) or a function that will be called with every layer of the
   * map and that must return <code>true</code> for layers that should
   * be handled by the interaction. You may also use <code>undefined</code>,
   * in which case all layers will be included.
   *
   * @param {Array<ol.layer.Layer>|function(layer: ol.layer.Layer):boolean|undefined} value
   *        the new layer selector
   */
  setLayers (value) {
    this._layers = value
    this._layerSelectorFunction = undefined
  }
}

/**
 * React wrapper around an instance of {@link ContextMenuInteraction}
 * that allows us to use it in JSX.
 */
export default class ContextMenu extends interaction.OLInteraction {
  createInteraction (props) {
    return new ContextMenuInteraction(props)
  }
}

ContextMenu.propTypes = Object.assign({}, interaction.OLInteraction.propTypes, {
  layers: PropTypes.oneOfType([
    PropTypes.func, PropTypes.arrayOf(ol.layer.Layer)
  ]),
  select: PropTypes.func,
  contextMenu: PropTypes.func,
  threshold: PropTypes.number
})
