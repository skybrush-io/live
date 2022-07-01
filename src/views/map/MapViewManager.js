/**
 * @file Class for handling various parameters of an openlayers map's view.
 * (position, rotation, zoom)
 */

import round from 'lodash-es/round';
import { isEmpty } from 'ol/extent';
import { fromExtent } from 'ol/geom/Polygon';

import { toDegrees, toRadians } from '~/utils/math';

import {
  mapReferenceRequestSignal,
  mapViewToLocationSignal,
  mapViewToExtentSignal,
} from '~/signals';
import {
  mapViewCoordinateFromLonLat,
  lonLatFromMapViewCoordinate,
  normalizeAngle,
} from '~/utils/geography';

/**
 * Class for handling various parameters of an OpenLayers map's view.
 * (center, rotation, zoom)
 */
export default class MapViewManager {
  constructor() {
    this.callbacks = {
      center: [],
      rotation: [],
      zoom: [],
    };

    mapViewToLocationSignal.add(this.scrollMapViewToLocation);
    mapViewToExtentSignal.add(this.fitMapViewToExtent);
  }

  /**
   * Initializer function that requests the map reference.
   */
  initialize = () => {
    mapReferenceRequestSignal.dispatch(this._onMapReferenceReceived);
  };

  /**
   * Make the map's view fit a given extent.
   *
   * @param {Object} extent The extent to fit.
   * @param {number} options.duration The desired duration of the transition.
   * @param {number} options.padding  The padding on each side of the bounding box
   */
  fitMapViewToExtent = (extent, options) => {
    const { duration, padding } = {
      duration: 1000,
      padding: 0,
      ...options,
    };

    if (isEmpty(extent)) {
      console.warn('Cannot fit empty extent');
    } else if (this.view) {
      this.view.fit(fromExtent(extent), {
        duration,
        padding:
          typeof padding === 'number'
            ? [padding, padding, padding, padding]
            : padding,
      });
    } else {
      this._handleNoMapView();
    }
  };

  /**
   * Jump to a specific location on the map's view.
   *
   * @param {Object} location The location descriptor to jump to.
   * @param {number} options.duration The desired duration of the transition.
   */
  scrollMapViewToLocation = (location, options) => {
    const { center, rotation, zoom } = location;
    const { duration } = {
      duration: 1000,
      ...options,
    };

    const animationParameters = { duration };

    if (center !== undefined) {
      animationParameters.center = mapViewCoordinateFromLonLat([
        center.lon,
        center.lat,
      ]);
    }

    if (rotation !== undefined) {
      animationParameters.rotation = toRadians(-rotation);
    }

    if (zoom !== undefined) {
      animationParameters.zoom = zoom;
    }

    if (this.view) {
      this.view.animate(animationParameters);
    } else {
      this._handleNoMapView();
    }
  };

  /**
   * Callback for receiving the map reference.
   * Attaches event handlers to the map and it's view.
   *
   * @param {ol.Map} map the map to attach the event handlers to.
   */
  _onMapReferenceReceived = (map) => {
    this.map = map;

    this.view = map.getView();
    this.view.on('propertychange', this._onViewPropertyChanged);

    // Map.getView().on('propertychange', this.updateFromMap_)

    map.on('propertychange', (e) => {
      if (e.key === 'view') {
        this.view.un('propertychange', this._onViewPropertyChanged);
        this.view = map.getView();
        this.view.on('propertychange', this._onViewPropertyChanged);
      }
    });
  };

  /**
   * Listener function for running the appropriate callback functions when a
   * property changes on the connected view.
   *
   * @param {ol.ObjectEvent} e the propertychange event emitted by openlayers.
   */
  _onViewPropertyChanged = (e) => {
    switch (e.key) {
      case 'center': {
        const center = lonLatFromMapViewCoordinate(this.view.getCenter()).map(
          (c) => round(c, 6)
        );
        for (const c of this.callbacks.center)
          c({ lon: center[0], lat: center[1] });
        break;
      }

      case 'rotation': {
        const rotation = toDegrees(-this.view.getRotation());
        for (const c of this.callbacks.rotation) c(normalizeAngle(rotation));

        break;
      }

      case 'resolution': {
        const zoom = this.view.getZoom();
        for (const c of this.callbacks.zoom) c(zoom);

        break;
      }
      // No default
    }
  };

  /**
   * Method for attaching an event listener to the change of
   * a specific property.
   *
   * @param {string} property the property to attach the callback to.
   * @param {function} callback the function to run when the given
   * property changes.
   */
  addListener = (property, callback) => {
    if (!(property in this.callbacks)) {
      throw new Error(`Cannot add listener to unknown property: ${property}.`);
    }

    // Avoiding push to prevent mutation by side effects
    this.callbacks[property] = this.callbacks[property].concat(callback);
  };

  /**
   * Method for removing an event listener from the change of a property.
   *
   * @param {string} property the property to remove the callback from.
   * @param {function} callback the function to remove.
   */
  removeListener = (property, callback) => {
    if (!(property in this.callbacks)) {
      throw new Error(
        `Cannot remove listener from unknown property: ${property}.`
      );
    }

    if (!this.callbacks[property].includes(callback)) {
      throw new Error(
        'Cannot remove event listener that has not yet been added.'
      );
    }

    // Avoiding splice to prevent mutation by side effects
    this.callbacks[property] = this.callbacks[property].filter(
      (c) => c !== callback
    );
  };

  _handleNoMapView() {
    console.warn('No map view was mounted yet');
  }
}
