/**
 * @file Class for handling various parameters of an OpenLayers map's view.
 * (position, rotation, zoom)
 */

import round from 'lodash-es/round';
import type { Extent } from 'ol/extent';
import { isEmpty } from 'ol/extent';
import { fromExtent } from 'ol/geom/Polygon';
import type Map from 'ol/Map';
import type { ObjectEvent } from 'ol/Object';
import type View from 'ol/View';

import { toDegrees, toRadians } from '@skybrush/math';

import {
  mapReferenceRequestSignal,
  mapViewToExtentSignal,
  mapViewToLocationSignal,
  type MapViewAnimationOptions,
  type MapViewLocation,
} from '~/signals';
import {
  lonLatFromMapViewCoordinate,
  mapViewCoordinateFromLonLat,
  normalizeAngle,
  type LatLonObject,
  type LonLat,
} from '~/utils/geography';

type MapViewListener = {
  center: (center: LatLonObject) => void;
  rotation: (rotation: string) => void;
  zoom: (zoom: number | undefined) => void;
};

type Callbacks = {
  center: Array<(center: LatLonObject) => void>;
  rotation: Array<(rotation: string) => void>;
  zoom: Array<(zoom: number | undefined) => void>;
};

/**
 * Class for handling various parameters of an OpenLayers map's view.
 * (center, rotation, zoom)
 */
export default class MapViewManager {
  map?: Map;
  view?: View;
  callbacks: Callbacks = {
    center: [],
    rotation: [],
    zoom: [],
  };

  constructor() {
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
   * @param extent The extent to fit.
   * @param options.duration The desired duration of the transition.
   * @param options.padding The padding on each side of the bounding box
   */
  fitMapViewToExtent = (
    extent: Extent,
    options: MapViewAnimationOptions = {}
  ) => {
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
   * @param location The location descriptor to jump to.
   * @param options.duration The desired duration of the transition.
   */
  scrollMapViewToLocation = (
    location: MapViewLocation,
    options: MapViewAnimationOptions = {}
  ) => {
    const { center, rotation, zoom } = location;
    const { duration } = {
      duration: 1000,
      ...options,
    };

    const animationParameters: Parameters<View['animate']>[0] = { duration };

    if (center !== undefined) {
      animationParameters.center = mapViewCoordinateFromLonLat([
        center.lon,
        center.lat,
      ]);
    }

    const effectiveRotation =
      rotation !== undefined ? Number(rotation) : undefined;
    if (effectiveRotation !== undefined && Number.isFinite(effectiveRotation)) {
      animationParameters.rotation = toRadians(-effectiveRotation);
    }

    const effectiveZoom = zoom !== undefined ? Number(zoom) : undefined;
    if (effectiveZoom !== undefined && Number.isFinite(effectiveZoom)) {
      animationParameters.zoom = effectiveZoom;
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
   * @param map the map to attach the event handlers to.
   */
  _onMapReferenceReceived = (map: Map) => {
    this.map = map;

    this.view = map.getView();
    this.view.on('propertychange', this._onViewPropertyChanged);

    map.on('propertychange', (e: ObjectEvent) => {
      if (e.key === 'view') {
        this.view!.un('propertychange', this._onViewPropertyChanged);
        this.view = map.getView();
        this.view.on('propertychange', this._onViewPropertyChanged);
      }
    });
  };

  /**
   * Listener function for running the appropriate callback functions when a
   * property changes on the connected view.
   *
   * @param e the propertychange event emitted by openlayers.
   */
  _onViewPropertyChanged = (e: ObjectEvent) => {
    switch (e.key) {
      case 'center': {
        const center = lonLatFromMapViewCoordinate(
          // NOTE: Non-null assertion justified: the 'center' propertychange
          // event implies the view has a center
          this.view!.getCenter()!
        ).map((c) => round(c, 6)) as LonLat;
        for (const c of this.callbacks.center)
          c({ lon: center[0], lat: center[1] });
        break;
      }

      case 'rotation': {
        const rotation = toDegrees(-this.view!.getRotation());
        for (const c of this.callbacks.rotation) c(normalizeAngle(rotation));

        break;
      }

      case 'resolution': {
        const zoom = this.view!.getZoom();
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
   * @param property the property to attach the callback to.
   * @param callback the function to run when the given
   * property changes.
   */
  addListener = <K extends keyof MapViewListener>(
    property: K,
    callback: MapViewListener[K]
  ) => {
    if (!(property in this.callbacks)) {
      throw new Error(`Cannot add listener to unknown property: ${property}.`);
    }

    // Avoiding push to prevent mutation by side effects
    this.callbacks[property] = this.callbacks[property].concat(
      callback
    ) as Callbacks[K];
  };

  /**
   * Method for removing an event listener from the change of a property.
   *
   * @param property the property to remove the callback from.
   * @param callback the function to remove.
   */
  removeListener = <K extends keyof MapViewListener>(
    property: K,
    callback: MapViewListener[K]
  ) => {
    if (!(property in this.callbacks)) {
      throw new Error(
        `Cannot remove listener from unknown property: ${property}.`
      );
    }

    if (!this.callbacks[property].some((c) => c === callback)) {
      throw new Error(
        'Cannot remove event listener that has not yet been added.'
      );
    }

    // Avoiding splice to prevent mutation by side effects
    this.callbacks[property] = this.callbacks[property].filter(
      (c) => c !== callback
    ) as Callbacks[K];
  };

  _handleNoMapView() {
    console.warn('No map view was mounted yet');
  }
}
