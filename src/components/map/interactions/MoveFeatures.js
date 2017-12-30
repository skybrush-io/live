/**
 * @file OpenLayers interaction that allows the user to move the selected
 * features by dragging.
 */

import { autobind } from 'core-decorators'
import { stubTrue } from 'lodash'
import { interaction } from 'ol-react'
import ol from 'openlayers'
import PropTypes from 'prop-types'

/**
 * OpenLayers interaction that allows the user to move the selected features
 * by dragging.
 *
 * This interaction is similar to ``ol.interaction.Translate``, but it does
 * not keep a reference to the selected features. Instead of that, it needs
 * a function that is invoked when the dragging starts. The function will
 * be called with the map object as its only argument, and it must
 * then return the features that *may* be moved by the interaction; typically,
 * you should return the current selection here.
 */
export class MoveFeaturesInteraction extends ol.interaction.Pointer {
  constructor (options) {
    super({
      handleDownEvent: event => {
        const features = this.featureProvider_
          ? this.featureProvider_(event.map)
          : []

        this.lastFeature_ = this.featureAtPixel_(event.pixel, event.map, features)
        if (!this.lastCoordinate_ && this.lastFeature_) {
          this.firstCoordinate_ = event.coordinate
          this.lastCoordinate_ = event.coordinate
          this.features_ = features
          this.dispatchEvent(
            new MoveFeaturesInteractionEvent(
              ol.interaction.TranslateEventType.TRANSLATESTART,
              features, event.coordinate, [0, 0]
            )
          )
          return true
        }
        return false
      },

      handleDragEvent: event => {
        if (this.lastCoordinate_) {
          const newCoordinate = event.coordinate
          const deltaX = newCoordinate[0] - this.lastCoordinate_[0]
          const deltaY = newCoordinate[1] - this.lastCoordinate_[1]
          const totalDelta = [
            this.lastCoordinate_[0] - this.firstCoordinate_[0],
            this.lastCoordinate_[1] - this.firstCoordinate_[1]
          ]
          const features = this.features_

          features.forEach(feature => {
            const geom = feature.getGeometry()
            geom.translate(deltaX, deltaY)
            feature.setGeometry(geom)
          })

          this.lastCoordinate_ = newCoordinate

          this.dispatchEvent(
            new MoveFeaturesInteractionEvent(
              ol.interaction.TranslateEventType.TRANSLATING,
              features, newCoordinate, totalDelta
            )
          )
        }
      },

      handleUpEvent: event => {
        if (this.lastCoordinate_) {
          const features = this.features_
          const totalDelta = [
            this.lastCoordinate_[0] - this.firstCoordinate_[0],
            this.lastCoordinate_[1] - this.firstCoordinate_[1]
          ]

          this.firstCoordinate_ = null
          this.lastCoordinate_ = null
          this.features_ = null

          this.dispatchEvent(
            new MoveFeaturesInteractionEvent(
              ol.interaction.TranslateEventType.TRANSLATEEND,
              features, event.coordinate, totalDelta
            )
          )

          return true
        }
        return false
      }
    })

    const effectiveOptions = options || {}

    this.firstCoordinate_ = null
    this.lastCoordinate_ = null
    this.features_ = null
    this.featureProvider_ = effectiveOptions.featureProvider
    this.layerFilter_ = this.createLayerFilterFromOptions_(effectiveOptions)
    this.hitTolerance_ = options.hitTolerance ? options.hitTolerance : 0
    this.lastFeature_ = null
  }

  /**
   * Creates the layer filter function that the interaction will use,
   * given the options provided to the constructor.
   *
   * @param  {Object} options  the options provided to the constructor
   * @return  {function}  a function that must be called with a layer and
   *          that will return true if the features in the layer can be moved
   */
  createLayerFilterFromOptions_ (options) {
    if (options.layers) {
      if (typeof options.layers === 'function') {
        return options.layers
      } else {
        const layers = options.layers
        return layer => ol.array.includes(layers, layer)
      }
    } else {
      return stubTrue
    }
  }

  /**
   * Returns the set of features at the given pixel on the given map,
   * excluding those that are not accepted by the layer filter.
   *
   * @param  {ol.Coordinate} pixel  the pixel coordiante where the user
   *         clicked on the map
   * @param  {ol.Map} map  the map being considered
   * @param  {ol.Feature[]}  features  the features returned by the feature
   *         provider function
   * @return {ol.Feature}  the first feature at the given pixel that is in
   *         the provided feature array and that also matches the layer
   *         selection function
   */
  @autobind
  featureAtPixel_ (pixel, map, features) {
    return map.forEachFeatureAtPixel(pixel,
      feature => {
        if (features && features.includes(feature)) {
          return feature
        }
      },
      {
        hitTolerance: this.hitTolerance_,
        layerFilter: this.layerFilter_
      }
    )
  }
}

class MoveFeaturesInteractionEvent extends ol.events.Event {
  constructor (type, features, coordinate, delta) {
    super(type)
    this.features = features
    this.coordinate = coordinate
    this.delta = delta
  }
}

/**
 * React wrapper around an instance of {@link MoveFeaturesInteraction}
 * that allows us to use it in JSX.
 */
export default class MoveFeatures extends interaction.OLInteraction {
  createInteraction (props) {
    return new MoveFeaturesInteraction(props)
  }
}

MoveFeatures.propTypes = Object.assign({}, interaction.OLInteraction.propTypes, {
  featureProvider: PropTypes.func.isRequired,
  hitTolerance: PropTypes.number,
  layers: PropTypes.oneOfType([
    PropTypes.func, PropTypes.arrayOf(ol.layer.Layer)
  ]),

  translateend: PropTypes.func,
  translating: PropTypes.func,
  translatestart: PropTypes.func
})
MoveFeatures.olEvents = [
  'translatestart', 'translating', 'translateend'
]
MoveFeatures.olProps = [
  'featureProvider', 'hitTolerance', 'layers'
]
