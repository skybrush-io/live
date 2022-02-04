/**
 * @file OpenLayers interaction that tracks the feature of a layer that is
 * that is closest to the point where the mouse is, and calls a callback whenever
 * the nearest feature changes.
 */

import isNil from 'lodash-es/isNil';
import * as Condition from 'ol/events/condition';
import Interaction from 'ol/interaction/Interaction';
import Layer from 'ol/layer/Layer';
import PropTypes from 'prop-types';

import { createOLInteractionComponent } from '@collmot/ol-react/lib/interaction';

import { createLayerSelectorFunction } from './utils';

/**
 * OpenLayers interaction that tracks the feature of a layer that is
 * that is closest to the point where the mouse is, and calls a callback whenever
 * the nearest feature changes.
 */
class TrackNearestFeatureInteraction extends Interaction {
  _lastFeature = null;
  _hideTimeout = null;

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
   * @param {number|undefined} options.hitTolerance  the distance threshold;
   *        the selection callback will be called only when the distance
   *        between the pixel of the map browser event and the pixel of the
   *        feature is not larger than this value. The default is zero.
   */
  constructor(options = {}) {
    super({
      handleEvent: (mapBrowserEvent) => {
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
          (feature) => feature,
          {
            layerFilter: this._layerSelectorFunction,
            hitTolerance: this._hitTolerance,
          }
        );

        // TODO(ntamas): maybe try to be stateful and stick to the previously
        // selected feature if it is still "within range"?

        if (trackedFeature !== this._lastFeature) {
          this._setTrackedFeature(trackedFeature);
        }

        return true;
      },
    });

    const defaultOptions = {
      hitTolerance: 0,
    };
    options = Object.assign(defaultOptions, options);

    this._nearestFeatureChanged = options.onNearestFeatureChanged;
    this._hitTolerance = options.hitTolerance;
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

  setMap(value) {
    let map = this.getMap();

    if (map) {
      const viewport = map.getViewport();
      if (viewport) {
        viewport.removeEventListener('pointerout', this._onPointerOut);
      }
    }

    super.setMap(value);

    map = this.getMap();
    if (map) {
      const viewport = map.getViewport();
      if (viewport) {
        viewport.addEventListener('pointerout', this._onPointerOut);
      }
    }
  }

  /**
   * Event handler that is called when the mouse cursor leaves the map.
   */
  _onPointerOut = () => {
    this._setTrackedFeature(null);
  };

  /**
   * Sets the feature currently tracked by the interaction to the given feature,
   * calling the callbacks as necessary.
   *
   * When setting the feature to null, the event is delayed by 100 msec to ensure
   * that there is no "blinking" when the mouse is dragged from one feature to
   * another with a gap of a few pixels between them.
   */
  _setTrackedFeature = (feature) => {
    if (feature === this._lastFeature) {
      return;
    }

    this._lastFeature = feature;

    if (this._nearestFeatureChanged) {
      if (isNil(feature)) {
        this._hideTimeout = setTimeout(
          () => this._nearestFeatureChanged(null),
          100
        );
      } else {
        if (this._hideTimeout) {
          clearTimeout(this._hideTimeout);
          this._hideTimeout = null;
        }

        this._nearestFeatureChanged(feature);
      }
    }
  };
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
      hitTolerance: PropTypes.number,
      layers: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(Layer)]),
      onNearestFeatureChanged: PropTypes.func,
    },
    fragileProps: ['layers', 'hitTolerance'],
  }
);
