/**
 * @file OpenLayers interaction that allows the user to move the selected
 * features by dragging.
 */

import { autobind } from 'core-decorators';
import { stubTrue } from 'lodash';
import { includes } from 'ol/array';
import OLEvent from 'ol/events/Event';
import * as Extent from 'ol/extent';
import PointerInteraction from 'ol/interaction/Pointer';
import Layer from 'ol/layer/Layer';
import PropTypes from 'prop-types';

import { createOLInteractionComponent } from '@collmot/ol-react/lib/interaction';

import Condition from '../conditions';

/**
 * Enum containing the supported transformation types.
 */
export const TransformationType = {
  MOVE: 'move',
  ROTATE: 'rotate'
};

/**
 * Mapping from supported transformation types to their handler functions.
 *
 * These handler functions will be invoked in a way that `this` refers to the
 * transformation parameters.
 */
const transformationTypeToHandler = {
  move(geom, deltaX, deltaY) {
    geom.translate(deltaX, deltaY);
  },

  rotate(geom, deltaX, deltaY, totalDelta) {
    const angle = (totalDelta[1] * Math.PI) / 180;
    const angleDelta = angle - (this.lastAngle || 0);
    geom.rotate(angleDelta, this.center);
    this.lastAngle = angle;
  }
};

/**
 * OpenLayers interaction that allows the user to move or rotate the
 * selected features by dragging.
 *
 * This interaction is similar to ``ol.interaction.Translate``, but it
 * does not keep a reference to the selected features. Instead of that,
 * it needs a function that is invoked when the dragging starts. The
 * function will be called with the map object as its only argument,
 * and it must then return the features that *may* be moved by
 * the interaction; typically, you should return the current
 * selection here.
 */
export class TransformFeaturesInteraction extends PointerInteraction {
  constructor(options) {
    super({
      handleDownEvent: event => {
        const type = this.decideTypeFromEvent_(event);
        if (!type) {
          return false;
        }

        const features = this.featureProvider_
          ? this.featureProvider_(event.map)
          : [];

        this.lastFeature_ = this.featureAtPixel_(
          event.pixel,
          event.map,
          features
        );
        if (!this.lastCoordinate_ && this.lastFeature_) {
          this.firstCoordinate_ = event.coordinate;
          this.lastCoordinate_ = event.coordinate;
          this.features_ = features;
          this.transformation_ = {
            handler: transformationTypeToHandler[type],
            type
          };

          if (type === 'rotate') {
            const extent = Extent.createEmpty();
            features.forEach(feature => {
              const geom = feature.getGeometry();
              if (feature.getId().slice(0, 5) === 'home$') {
                Extent.extend(
                  extent,
                  Extent.boundingExtent([geom.getFirstCoordinate()])
                );
              } else {
                Extent.extend(extent, geom.getExtent());
              }
            });
            this.transformation_.center = Extent.getCenter(extent);
          }

          this.dispatchEvent(
            new TransformFeaturesInteractionEvent(
              TransformEventType.TRANSFORM_START,
              features,
              event.coordinate,
              [0, 0]
            )
          );

          return true;
        }

        return false;
      },

      handleDragEvent: event => {
        if (this.lastCoordinate_) {
          const newCoordinate = event.coordinate;
          const deltaX = newCoordinate[0] - this.lastCoordinate_[0];
          const deltaY = newCoordinate[1] - this.lastCoordinate_[1];
          const totalDelta = this.calculateTotalDelta_();
          const features = this.features_;

          features.forEach(feature => {
            const geom = feature.getGeometry();
            this.transformation_.handler(geom, deltaX, deltaY, totalDelta);
            feature.setGeometry(geom);
          });

          this.lastCoordinate_ = newCoordinate;

          this.dispatchEvent(
            new TransformFeaturesInteractionEvent(
              TransformEventType.TRANSFORMING,
              features,
              newCoordinate,
              totalDelta
            )
          );
        }
      },

      handleUpEvent: event => {
        if (this.lastCoordinate_) {
          const features = this.features_;
          const totalDelta = this.calculateTotalDelta_();

          this.firstCoordinate_ = null;
          this.lastCoordinate_ = null;
          this.features_ = null;
          this.transformation_ = null;

          this.dispatchEvent(
            new TransformFeaturesInteractionEvent(
              TransformEventType.TRANSFORM_END,
              features,
              event.coordinate,
              totalDelta
            )
          );

          return true;
        }

        return false;
      }
    });

    const effectiveOptions = {
      moveCondition: Condition.always,
      rotateCondition: Condition.never,
      ...options
    };

    this.firstCoordinate_ = null;
    this.lastCoordinate_ = null;
    this.features_ = null;
    this.featureProvider_ = effectiveOptions.featureProvider;
    this.layerFilter_ = this.createLayerFilterFromOptions_(effectiveOptions);
    this.hitTolerance_ = effectiveOptions.hitTolerance
      ? effectiveOptions.hitTolerance
      : 0;
    this.lastFeature_ = null;
    this.moveCondition_ = effectiveOptions.moveCondition;
    this.rotateCondition_ = effectiveOptions.rotateCondition;
    this.transformation_ = null;
  }

  /**
   * Calculate the total displacement between the first and the last
   * mouse events during a drag.
   *
   * @return {ol.Coordinate}  the total displacement
   */
  calculateTotalDelta_() {
    return [
      this.lastCoordinate_[0] - this.firstCoordinate_[0],
      this.lastCoordinate_[1] - this.firstCoordinate_[1]
    ];
  }

  /**
   * Creates the layer filter function that the interaction will use,
   * given the options provided to the constructor.
   *
   * @param  {Object} options  the options provided to the constructor
   * @return  {function}  a function that must be called with a layer and
   *          that will return true if the features in the layer can be moved
   */
  createLayerFilterFromOptions_(options) {
    if (options.layers) {
      if (typeof options.layers === 'function') {
        return options.layers;
      }

      const { layers } = options;
      return layer => includes(layers, layer);
    }

    return stubTrue;
  }

  /**
   * Decides the type of the transformation to perform from an event that
   * starts a drag sequence.
   *
   * @param  {ol.events.MapBrowserEvent}  event  the event
   * @return {string}  the type of the transformation to perform
   */
  decideTypeFromEvent_(event) {
    if (this.moveCondition_(event)) {
      return 'move';
    }

    if (this.rotateCondition_(event)) {
      return 'rotate';
    }

    return undefined;
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
  featureAtPixel_(pixel, map, features) {
    let result;

    if (features) {
      map.forEachFeatureAtPixel(
        pixel,
        feature => {
          if (features.includes(feature)) {
            result = feature;
            return true; // To stop further checks
          }
        },
        {
          hitTolerance: this.hitTolerance_,
          layerFilter: this.layerFilter_
        }
      );
    }

    return result;
  }
}

/**
 * Event types used by {@link TransformFeaturesInteraction}
 */
const TransformEventType = {
  TRANSFORM_START: 'transformStart',
  TRANSFORMING: 'transforming',
  TRANSFORM_END: 'transformEnd'
};

class TransformFeaturesInteractionEvent extends OLEvent {
  constructor(type, features, coordinate, delta) {
    super(type);
    this.features = features;
    this.coordinate = coordinate;
    this.delta = delta;
  }
}

/**
 * React wrapper around an instance of {@link TransformFeaturesInteraction}
 * that allows us to use it in JSX.
 */
export default createOLInteractionComponent(
  'TransformFeatures',
  props => new TransformFeaturesInteraction(props),
  {
    propTypes: {
      featureProvider: PropTypes.func.isRequired,
      hitTolerance: PropTypes.number,
      layers: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(Layer)]),
      moveCondition: PropTypes.func,
      rotateCondition: PropTypes.func,

      onTransformEnd: PropTypes.func,
      onTransforming: PropTypes.func,
      onTransformStart: PropTypes.func
    },
    events: ['transformStart', 'transforming', 'transformEnd'],
    eventMap: {
      onTransformStart: 'transformStart',
      onTransforming: 'transforming',
      onTransformEnd: 'transformEnd'
    },
    fragileProps: [
      'featureProvider',
      'hitTolerance',
      'layers',
      'moveCondition',
      'rotateCondition'
    ]
  }
);
