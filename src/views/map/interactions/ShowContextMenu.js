/**
 * @file OpenLayers interaction (for right click by default) that overwrites the
 * active selection if there is a not yet selected point feature of a layer that
 * is close enough to the point where the user clicked and triggers a context-menu.
 */

import includes from 'lodash-es/includes';
import isArray from 'lodash-es/isArray';
import isFunction from 'lodash-es/isFunction';
import minBy from 'lodash-es/minBy';
import partial from 'lodash-es/partial';
import stubFalse from 'lodash-es/stubFalse';
import stubTrue from 'lodash-es/stubTrue';

import Interaction from 'ol/interaction/Interaction';
import VectorLayer from 'ol/layer/Vector';
import Map from 'ol/Map';
import { transform } from 'ol/proj';
import PropTypes from 'prop-types';
import React from 'react';

import { OLPropTypes, withMap } from '@collmot/ol-react';
import { createOLInteractionComponent } from '@collmot/ol-react/lib/interaction';

import { euclideanDistance2D } from '~/utils/math';

import * as Condition from '../conditions';

/**
 * OpenLayers interaction (for right click by default) that overwrites the
 * active selection if there is a not yet selected point feature of a layer that
 * is close enough to the point where the user clicked and triggers a context-menu.
 */
class ContextMenuInteraction extends Interaction {
  constructor(options = {}) {
    super({
      handleEvent: (mapBrowserEvent) => {
        // Check whether the event matches the condition
        if (!this._condition(mapBrowserEvent)) {
          return true;
        }

        // Prevent the default action for this event
        mapBrowserEvent.originalEvent.preventDefault();

        // If we have a selection action, extend the selection as needed if the
        // user clicked near something
        if (this._selectAction) {
          // Create the layer selector function if needed
          if (!this._layerSelectorFunction) {
            this._layerSelectorFunction = this._createLayerSelectorFunction(
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
          const relevantFeatures = map
            .getLayers()
            .getArray()
            .filter(this._isLayerFeasible)
            .filter(this._layerSelectorFunction)
            .map((layer) => {
              const source = layer.getSource();
              return source
                ? source.getClosestFeatureToCoordinate(coordinate)
                : undefined;
            })
            .filter(this._isFeatureFeasible);
          const closestFeature =
            relevantFeatures && relevantFeatures.length > 0
              ? minBy(relevantFeatures, distanceFunction)
              : undefined;

          if (closestFeature) {
            // Get the actual distance of the feature
            const distance = distanceFunction(closestFeature);

            // If the feature is close enough...
            if (distance <= this._threshold && this._selectAction) {
              // Now call the callback
              this._selectAction('add', closestFeature, distance);
            }
          }
        }

        // Trigger the context menu hook function if the user specified one
        if (this._onContextMenu) {
          const coords = this._getLonLatFromEvent(mapBrowserEvent);
          this._onContextMenu(mapBrowserEvent, coords);
        }

        return Condition.pointerMove(mapBrowserEvent);
      },
    });

    const defaultOptions = {
      condition: Condition.contextMenu,
      threshold: Number.POSITIVE_INFINITY,
    };
    options = Object.assign(defaultOptions, options);

    this._condition = options.condition;
    this._projection = options.projection;
    this._selectAction = options.selectAction;
    this._onContextMenu = options.onContextMenu;
    this._threshold = options.threshold;
    this.setLayers(options.layers);
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
  _createLayerSelectorFunction(layers) {
    if (layers) {
      if (isFunction(layers)) {
        return layers;
      }

      if (isArray(layers)) {
        return (layer) => includes(layers, layer);
      }

      return stubFalse;
    }

    return stubTrue;
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
    const geom = feature.getGeometry();
    if (geom.intersectsCoordinate(event.coordinate)) {
      return 0;
    }

    const closestPoint = geom.getClosestPoint(event.coordinate);
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
   * Returns the longitude and latitude of the point that the user clicked
   * on, given a map event.
   *
   * @param {Event} event  the event corresponding to the click
   * @return {number[]}  the longitude and latitude of the click
   */
  _getLonLatFromEvent(event) {
    return this._projection
      ? transform(event.coordinate, 'EPSG:3857', this._projection)
      : event.coordinate;
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

const ShowContextMenuInner = createOLInteractionComponent(
  'ShowContextMenuInner',
  (props) => new ContextMenuInteraction(props),
  {
    propTypes: {
      condition: PropTypes.func,
      layers: OLPropTypes.LayerFilter,
      onContextMenu: PropTypes.func,
      selectAction: PropTypes.func,
      threshold: PropTypes.number,
    },
    fragileProps: [
      'condition',
      'layers',
      'onContextMenu',
      'selectAction',
      'threshold',
    ],
  }
);

/**
 * React wrapper around an instance of {@link ContextMenuInteraction}
 * that allows us to use it in JSX.
 */
class ShowContextMenu extends React.Component {
  static propTypes = {
    active: PropTypes.bool,
    children: PropTypes.element,
    layers: OLPropTypes.LayerFilter,
    map: PropTypes.instanceOf(Map),
    onOpening: PropTypes.func,
    projection: PropTypes.string,
    select: PropTypes.func,
    contextMenu: PropTypes.func,
    threshold: PropTypes.number,
  };

  constructor(props) {
    super(props);
    this._contextMenuRef = React.createRef();
  }

  render() {
    const { children, ...rest } = this.props;
    if (children) {
      return (
        <ShowContextMenuInner
          onContextMenu={this._openContextMenuFromChild}
          {...rest}
        >
          {React.cloneElement(React.Children.only(this.props.children), {
            ref: this._contextMenuRef,
          })}
        </ShowContextMenuInner>
      );
    }

    return null;
  }

  _openContextMenuFromChild = (event, coords) => {
    const menu = this._contextMenuRef.current;
    const open =
      menu.open ||
      (menu.getWrappedInstance ? menu.getWrappedInstance().open : undefined);
    if (open) {
      const position = {
        left: event.originalEvent.pageX,
        top: event.originalEvent.pageY,
      };

      if (this.props.onOpening) {
        this.props.onOpening(event, coords);
      }

      open(position, { coords });
    }
  };
}

export default withMap(ShowContextMenu);
