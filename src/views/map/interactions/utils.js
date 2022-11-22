import includes from 'lodash-es/includes';
import isArray from 'lodash-es/isArray';
import isEqual from 'lodash-es/isEqual';
import isFunction from 'lodash-es/isFunction';
import stubFalse from 'lodash-es/stubFalse';
import stubTrue from 'lodash-es/stubTrue';

/**
 * Constructs an OpenLayers layer selector function from the given object.
 *
 * @param {Array<ol.layer.Layer>|function(layer: ol.layer.Layer):boolean|undefined} layers
 *        the layer selector object; either an array of layers that should
 *        be matched by the layer selector function, or a function that
 *        returns true for layers that should be included in the selection
 * @return {function(layer: ol.layer.Layer):boolean} an appropriate layer
 *         selector function
 */
export function createLayerSelectorFunction(layers) {
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
 * Callback for keeping an OpenLayers LineString geometry's ends connected.
 *
 * @param {ol.events.Event} event
 *        the change event originating from the modification of the geometry
 */
export const snapEndToStart = (event) => {
  const coordinates = event.target.getCoordinates();
  if (!isEqual(coordinates.at(0), coordinates.at(-1))) {
    coordinates.splice(-1, 1, coordinates[0]);
    event.target.setCoordinates(coordinates);
  }
};
