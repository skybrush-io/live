/**
 * @file OpenLayers interaction (for right click by default) that overwrites the
 * active selection if there is a not yet selected point feature of a layer that
 * is close enough to the point where the user clicked and triggers a context-menu.
 */

import { autobind } from 'core-decorators'
import _ from 'lodash'
import Interaction from 'ol/interaction/interaction'
import Layer from 'ol/layer/layer'
import VectorLayer from 'ol/layer/vector'
import { interaction } from 'ol-react'
import PropTypes from 'prop-types'
import React from 'react'

import Condition from '../conditions'
import { euclideanDistance } from '../../../utils/geography'

/**
 * OpenLayers interaction (for right click by default) that overwrites the
 * active selection if there is a not yet selected point feature of a layer that
 * is close enough to the point where the user clicked and triggers a context-menu.
 */
class ContextMenuInteraction extends Interaction {
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
        if (distance <= this._threshold && this._selectAction) {
          // Now call the callback
          this._selectAction('add', closestFeature, distance)
        }

        // Trigger the context menu hook function if the user specified
        // one
        if (this._onContextMenu) {
          this._onContextMenu(mapBrowserEvent)
        }

        return Condition.pointerMove(mapBrowserEvent)
      }
    })

    const defaultOptions = {
      condition: Condition.rightClick,
      threshold: Number.POSITIVE_INFINITY
    }
    options = Object.assign(defaultOptions, options)

    this._condition = options.condition
    this._selectAction = options.selectAction
    this._onContextMenu = options.onContextMenu
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
    const geom = feature.getGeometry()
    if (geom.intersectsCoordinate(event.coordinate)) {
      return 0
    }
    const closestPoint = geom.getClosestPoint(event.coordinate)
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
    return layer && layer.getVisible() && layer instanceof VectorLayer
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
export default class ShowContextMenu extends interaction.OLInteraction {
  constructor (props) {
    super(props)
    this._assignContextMenuRef = (value) => { this._contextMenu = value }
  }

  createInteraction (props) {
    const effectiveProps = { ...props }
    if (!props.onContextMenu) {
      effectiveProps.onContextMenu = this._openContextMenuFromChild
    }
    return new ContextMenuInteraction(effectiveProps)
  }

  render () {
    return this.props.children ? (
      React.cloneElement(this.props.children, {
        ref: this._assignContextMenuRef
      })
    ) : null
  }

  @autobind
  _openContextMenuFromChild (event) {
    const menu = this._contextMenu
    const open =
      menu.open || (
        menu.getWrappedInstance ? menu.getWrappedInstance().open : undefined
      )
    if (open) {
      const position = {
        left: event.originalEvent.pageX,
        top: event.originalEvent.pageY
      }
      open(position)
    }
  }
}

ShowContextMenu.propTypes = Object.assign({}, interaction.OLInteraction.propTypes, {
  layers: PropTypes.oneOfType([
    PropTypes.func, PropTypes.arrayOf(Layer)
  ]),
  select: PropTypes.func,
  contextMenu: PropTypes.func,
  threshold: PropTypes.number,
  children: PropTypes.element
})
