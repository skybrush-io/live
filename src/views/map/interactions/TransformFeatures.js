/**
 * @file OpenLayers interaction that allows the user to move the selected
 * features by dragging.
 */

import stubTrue from 'lodash-es/stubTrue';
import { includes } from 'ol/array';
import OLEvent from 'ol/events/Event';
import * as Extent from 'ol/extent';
import PointerInteraction from 'ol/interaction/Pointer';
import Layer from 'ol/layer/Layer';
import PropTypes from 'prop-types';

import { createOLInteractionComponent } from '@collmot/ol-react/lib/interaction';

import Condition from '../conditions';

import { isOriginId } from '~/model/identifiers';
import { toDegrees, toRadians } from '~/utils/math';

/**
 * Enum containing the supported transformation types.
 */
export const TransformationType = {
  MOVE: 'move',
  ROTATE: 'rotate',
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
    // Rotation gesture is handled by assuming that this.pivot was moved by
    // (deltaX, deltaY) to P = (this.pivot + totalDelta). We calculate the angle
    // of the rotation around this.center that would make this.center,
    // this.pivot and P collinear.

    const centerToPivot = [
      this.pivot[0] - this.center[0],
      this.pivot[1] - this.center[1],
    ];
    const centerToTarget = [
      centerToPivot[0] + totalDelta[0],
      centerToPivot[1] + totalDelta[1],
    ];
    const centerToPivotAngle = Math.atan2(centerToPivot[1], centerToPivot[0]);
    const centerToTargetAngle = Math.atan2(
      centerToTarget[1],
      centerToTarget[0]
    );
    const angle = centerToTargetAngle - centerToPivotAngle;

    const angleDelta = angle - (this.lastAngle || 0);
    geom.rotate(angleDelta, this.center);
    this.lastAngle = angle;
  },
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
      handleDownEvent: (event) => {
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
            type,
          };

          if (type === 'rotate') {
            const extent = Extent.createEmpty();
            for (const feature of features) {
              const geom = feature.getGeometry();
              if (isOriginId(feature.getId())) {
                Extent.extend(
                  extent,
                  Extent.boundingExtent([geom.getFirstCoordinate()])
                );
              } else {
                Extent.extend(extent, geom.getExtent());
              }
            }

            this.transformation_.center = Extent.getCenter(extent);
            this.transformation_.pivot = event.coordinate;
          }

          this.transformation_.lastAngle = 0;

          this.dispatchEvent(
            new TransformFeaturesInteractionEvent(
              TransformEventType.TRANSFORM_START,
              type,
              features,
              event.coordinate,
              [0, 0],
              0
            )
          );

          return true;
        }

        return false;
      },

      handleDragEvent: (event) => {
        if (this.lastCoordinate_) {
          const newCoordinate = event.coordinate;
          const deltaX = newCoordinate[0] - this.lastCoordinate_[0];
          const deltaY = newCoordinate[1] - this.lastCoordinate_[1];
          const totalDelta = this.calculateTotalDelta_();
          const features = this.features_;
          const { type } = this.transformation_;

          for (const feature of features) {
            const geom = feature.getGeometry();
            this.transformation_.handler(geom, deltaX, deltaY, totalDelta);
            feature.setGeometry(geom);
          }

          this.lastCoordinate_ = newCoordinate;

          this.dispatchEvent(
            new TransformFeaturesInteractionEvent(
              TransformEventType.TRANSFORMING,
              type,
              features,
              newCoordinate,
              totalDelta,
              this.transformation_.lastAngle
            )
          );
        }
      },

      handleUpEvent: (event) => {
        if (this.lastCoordinate_) {
          const features = this.features_;
          const totalDelta = this.calculateTotalDelta_();
          const { lastAngle, type } = this.transformation_;

          this.firstCoordinate_ = null;
          this.lastCoordinate_ = null;
          this.features_ = null;
          this.transformation_ = null;

          this.dispatchEvent(
            new TransformFeaturesInteractionEvent(
              TransformEventType.TRANSFORM_END,
              type,
              features,
              event.coordinate,
              totalDelta,
              lastAngle
            )
          );

          return true;
        }

        return false;
      },
    });

    const effectiveOptions = {
      moveCondition: Condition.always,
      rotateCondition: Condition.never,
      ...options,
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
      this.lastCoordinate_[1] - this.firstCoordinate_[1],
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
      return (layer) => includes(layers, layer);
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
    if (event?.button === 0 || event?.originalEvent?.button === 0) {
      // Allow only left mouse clicks
      if (this.moveCondition_(event)) {
        return 'move';
      }

      if (this.rotateCondition_(event)) {
        return 'rotate';
      }
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
  featureAtPixel_ = (pixel, map, features) => {
    let result;

    if (features) {
      map.forEachFeatureAtPixel(
        pixel,
        (feature) => {
          if (features.includes(feature)) {
            result = feature;
            return true; // To stop further checks
          }
        },
        {
          hitTolerance: this.hitTolerance_,
          layerFilter: this.layerFilter_,
        }
      );
    }

    return result;
  };
}

/**
 * Event types used by {@link TransformFeaturesInteraction}
 */
const TransformEventType = {
  TRANSFORM_START: 'transformStart',
  TRANSFORMING: 'transforming',
  TRANSFORM_END: 'transformEnd',
};

class TransformFeaturesInteractionEvent extends OLEvent {
  constructor(type, subType, features, coordinate, delta, angleDelta = 0) {
    super(type);
    this.subType = subType;
    this.features = features;
    this.coordinate = coordinate;
    this.delta = delta;
    this.angleDelta = angleDelta;
  }

  get hasMoved() {
    return (
      (this.delta &&
        Array.isArray(this.delta) &&
        (this.delta[0] !== 0 || this.delta[1] !== 0)) ||
      (this.angleDelta && this.angleDelta !== 0)
    );
  }
}

/**
 * React wrapper around an instance of {@link TransformFeaturesInteraction}
 * that allows us to use it in JSX.
 */
export default createOLInteractionComponent(
  'TransformFeatures',
  (props) => new TransformFeaturesInteraction(props),
  {
    propTypes: {
      featureProvider: PropTypes.func.isRequired,
      hitTolerance: PropTypes.number,
      layers: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(Layer)]),
      moveCondition: PropTypes.func,
      rotateCondition: PropTypes.func,

      onTransformEnd: PropTypes.func,
      onTransforming: PropTypes.func,
      onTransformStart: PropTypes.func,
    },
    events: ['transformStart', 'transforming', 'transformEnd'],
    eventMap: {
      onTransformStart: 'transformStart',
      onTransforming: 'transforming',
      onTransformEnd: 'transformEnd',
    },
    fragileProps: [
      'featureProvider',
      'hitTolerance',
      'layers',
      'moveCondition',
      'rotateCondition',
    ],
  }
);
