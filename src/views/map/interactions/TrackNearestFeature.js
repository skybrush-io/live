/**
 * @file OpenLayers interaction that tracks the feature of a layer that is
 * that is closest to the point where the mouse is, and calls a callback whenever
 * the nearest feature changes.
 */

import * as Condition from 'ol/events/condition';
import Interaction from 'ol/interaction/Interaction';
import Layer from 'ol/layer/Layer';
import VectorLayer from 'ol/layer/Vector';
import PropTypes from 'prop-types';

import { createOLInteractionComponent } from '@collmot/ol-react/lib/interaction';

import { createLayerSelectorFunction } from './utils';

/**
 * OpenLayers interaction that tracks the feature of a layer that is
 * that is closest to the point where the mouse is, and calls a callback whenever
 * the nearest feature changes.
 */
class TrackNearestFeatureInteraction extends Interaction {
  /**
   * Constructor.
   *
   * The constructor takes a single options object whose keys and values
   * define how the interaction is customized.
   *
   * @param {Object} [options={}]  the options of the interaction
   * @param {Array<ol.layer.Layer>|function(layer: ol.layer.Layer):boolean|undefined}
   *        options.layers  the layers on which the interaction will operate, or
   *        a function that returns true for the layers that the interaction
   *        should operate on. Layers that are hidden will always be ignored.
   * @param {number|undefined} options.threshold  the distance threshold;
   *        the selection callback will be called only when the distance
   *        between the pixel of the map browser event and the closest feature
   *        is not larger than this value. The default is infinity.
   */
  constructor(options = {}) {
    super({
      handleEvent: (() => {
        let lastFeature;

        return (mapBrowserEvent) => {
          // Bail out if this is not a mouse move event
          if (!Condition.pointerMove(mapBrowserEvent)) {
            return true;
          }

          // Create the layer selector function if needed
          if (!this._layerSelectorFunction) {
            this._layerSelectorFunction = createLayerSelectorFunction(
              this._layers
            );
          }

          const { map, pixel } = mapBrowserEvent;
          const trackedFeature = map.forEachFeatureAtPixel(
            pixel,
            (feature) => feature
          );

          // TODO(ntamas): maybe try to be stateful and stick to the previously
          // selected feature if it is still "within range"?

          if (trackedFeature !== lastFeature) {
            lastFeature = trackedFeature;
            if (this._nearestFeatureChanged) {
              this._nearestFeatureChanged(trackedFeature);
            }
          }

          return true;
        };
      })(),
    });

    const defaultOptions = {
      threshold: Number.POSITIVE_INFINITY,
    };
    options = Object.assign(defaultOptions, options);

    this._nearestFeatureChanged = options.onNearestFeatureChanged;
    this._threshold = options.threshold;
    this.setLayers(options.layers);
  }

  /**
   * Returns the associated layer selector of the interaction.
   *
   * @return {Array<ol.layer.Layer>|function(layer: ol.layer.Layer):boolean|undefined}
   *         the layer selector
   */
  getLayers() {
    return this._layers;
  }

  /**
   * Returns whether a given layer is visible and has an associated vector
   * source.
   *
   * @param {ol.layer.Layer} layer  the layer to test
   * @return {boolean} whether the layer is visible and has an associated
   *         vector source
   */
  _isLayerFeasible(layer) {
    return layer && layer.getVisible() && layer instanceof VectorLayer;
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
  setLayers(value) {
    this._layers = value;
    this._layerSelectorFunction = undefined;
  }
}

/**
 * React wrapper around an instance of {@link SelectNearestFeatureInteraction}
 * that allows us to use it in JSX.
 */
export default createOLInteractionComponent(
  'SelectNearestFeature',
  (props) => new TrackNearestFeatureInteraction(props),
  {
    propTypes: {
      layers: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(Layer)]),
      onNearestFeatureChanged: PropTypes.func,
      threshold: PropTypes.number,
    },
    fragileProps: ['layers', 'threshold'],
  }
);
