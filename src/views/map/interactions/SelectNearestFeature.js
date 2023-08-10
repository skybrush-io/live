/**
 * @file OpenLayers interaction that selects the point feature of a layer
 * that is closest to the point where the user clicked (or moved the mouse),
 * along with a convenient React component wrapper.
 */

import partial from 'lodash-es/partial';

import * as Condition from 'ol/events/condition';
import Interaction from 'ol/interaction/Interaction';
import Layer from 'ol/layer/Layer';
import VectorLayer from 'ol/layer/Vector';
import PropTypes from 'prop-types';

import { createOLInteractionComponent } from '@collmot/ol-react/lib/interaction';

import { getExactClosestPointOf } from '~/utils/geography';
import { euclideanDistance2D } from '~/utils/math';

import { createLayerSelectorFunction } from './utils';

/**
 * OpenLayers interaction that selects the point feature of a layer that is
 * closest to the point where the user clicked (or moved the mouse).
 */
class SelectNearestFeatureInteraction extends Interaction {
  /**
   * Constructor.
   *
   * The constructor takes a single options object whose keys and values
   * define how the interaction is customized.
   *
   * @param {Object} [options={}]  the options of the interaction
   * @param {ol.Condition} [options.condition=ol.events.condition.primaryAction]
   *        the condition that decides whether the interaction should deal
   *        with the event.
   * @param {ol.Condition} [options.addCondition=ol.events.condition.never]
   *        when this condition evaluates to true with the current event,
   *        the interaction will add the nearest feature to the selection
   *        instead of overwriting it
   * @param {ol.Condition} [options.removeCondition=ol.events.condition.never]
   *        when this condition evaluates to true with the current event,
   *        the interaction will remove the nearest feature from the
   *        selection instead of overwriting the selection completely
   * @param {ol.Condition} [options.toggleCondition=ol.events.condition.never]
   *        when this condition evaluates to true with the current event,
   *        the interaction will toggle the nearest feature in the
   *        selection instead of overwriting the selection completely; in
   *        other words, if the feature is already in the selection, it will
   *        be removed, otherwise it will be added
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
      handleEvent: (mapBrowserEvent) => {
        // Bail out if this is not a click or double-click, and let the event
        // propagate to other interactions
        const isDoubleClick = Condition.doubleClick(mapBrowserEvent);
        if (!Condition.click(mapBrowserEvent) && !isDoubleClick) {
          return true;
        }

        // Bail out if this is not a primary click; this needs to be guarded
        // with the previous condition, otherwise OL will throw exceptions
        // for mouse move events
        if (!Condition.primaryAction(mapBrowserEvent)) {
          return true;
        }

        // Check whether the event matches the condition
        if (!this._condition(mapBrowserEvent)) {
          return true;
        }

        // Short-circuit if the user has not specified a callback
        if (!this._select) {
          return true;
        }

        // Create the layer selector function if needed
        if (!this._layerSelectorFunction) {
          this._layerSelectorFunction = createLayerSelectorFunction(
            this._layers
          );
        }

        // Find the feature that is closest to the selection, in each
        // matching layer
        const { coordinate, map } = mapBrowserEvent;
        const distanceFunction = partial(
          this._distanceOfEventFromFeature,
          mapBrowserEvent
        );
        const feasibleLayers = map
          .getLayers()
          .getArray()
          .filter(this._isLayerFeasible)
          .filter(this._layerSelectorFunction);
        const closestFeatureOnEachFeasibleLayer = feasibleLayers
          .map((layer) => {
            const source = layer.getSource();
            return source
              ? source.getClosestFeatureToCoordinate(
                  coordinate,
                  this._isFeatureFeasible
                )
              : undefined;
          })
          .filter(this._isFeatureFeasible)
          .reverse();

        // In the closestFeatureOnEachFeasibleLayer array, the topmost layer
        // is at the front. We need to iterate over it and stop at the first
        // feature that is closer than the threshold.
        let closestFeature;
        let distance;
        for (const feature of closestFeatureOnEachFeasibleLayer) {
          // Get the actual distance of the feature (if we have one)
          distance = distanceFunction(feature);
          if (distance <= this._threshold) {
            closestFeature = feature;
            break;
          }
        }

        // Decide whether we are setting, adding, removing, toggling or activating
        // the selection
        const mode = this._activateCondition(mapBrowserEvent)
          ? 'activate'
          : this._addCondition(mapBrowserEvent)
          ? 'add'
          : this._removeCondition(mapBrowserEvent)
          ? 'remove'
          : this._toggleCondition(mapBrowserEvent)
          ? 'toggle'
          : 'set';

        if (closestFeature !== undefined) {
          // Now call the callback
          this._select(mode, closestFeature, distance);

          // ...then prevent any further interactions in the interaction chain
          return false;
        } else {
          // No feature is close enough. In 'set' mode, we need to clear the
          // selection.
          if (mode === 'set') {
            this._select('clear');
          }

          // ...but let the event pass through to other interactions
          return true;
        }
      },
    });

    const defaultOptions = {
      condition: Condition.primaryAction,
      activateCondition: Condition.never,
      addCondition: Condition.never,
      removeCondition: Condition.never,
      toggleCondition: Condition.never,
      threshold: Number.POSITIVE_INFINITY,
    };
    options = Object.assign(defaultOptions, options);

    this._condition = options.condition;
    this._activateCondition = options.activateCondition;
    this._addCondition = options.addCondition;
    this._removeCondition = options.removeCondition;
    this._toggleCondition = options.toggleCondition;
    this._select = options.onSelect;
    this._threshold = options.threshold;
    this.setLayers(options.layers);
  }

  /**
   * Calculates the distance of a given feature from a given map browser
   * event. The distance will be returned in pixels.
   *
   * @param {ol.MapBrowserEvent}  event    the event
   * @param {ol.Feature}          feature  the feature
   * @return {number} the distance of the feature from the event, in pixels
   */
  _distanceOfEventFromFeature(event, feature) {
    const closestPoint = getExactClosestPointOf(
      feature.getGeometry(),
      event.coordinate
    );
    const closestPixel = event.map.getPixelFromCoordinate(closestPoint);
    return euclideanDistance2D(event.pixel, closestPixel);
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
   * Returns whether a given feature is feasible for selection.
   */
  _isFeatureFeasible(feature) {
    return Boolean(feature);
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
  (props) => new SelectNearestFeatureInteraction(props),
  {
    propTypes: {
      activateCondition: PropTypes.func,
      addCondition: PropTypes.func,
      layers: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(Layer)]),
      removeCondition: PropTypes.func,
      onSelect: PropTypes.func,
      threshold: PropTypes.number,
      toggleCondition: PropTypes.func,
    },
    fragileProps: [
      'activateCondition',
      'addCondition',
      'layers',
      'removeCondition',
      'threshold',
      'toggleCondition',
    ],
  }
);
