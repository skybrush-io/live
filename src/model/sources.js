/**
 * @file Constants and routines related to the source types that the user
 * can use on the map.
 */

import APIKeys from '~/api-keys';

/**
 * Enum containing constants for the source types that the user can use on the map.
 */
export const Source = {
  BING_MAPS: {
    AERIAL_WITH_LABELS: 'bingMaps.aerialWithLabels',
    ROAD: 'bingMaps.road',
  },
  GOOGLE_MAPS: {
    DEFAULT: 'googleMaps.default',
    SATELLITE: 'googleMaps.satellite',
    ROADS: 'googleMaps.roads',
  },
  MAPBOX: {
    SATELLITE: 'mapbox.satellite',
    STATIC: 'mapbox.static',
    VECTOR: 'mapbox.vector',
  },
  MAPTILER: {
    BASIC: 'maptiler.basic',
    HYBRID: 'maptiler.hybrid',
    SATELLITE: 'maptiler.satellite',
    STREETS: 'maptiler.streets',
  },
  NEXTZEN: 'nextzen',
  OSM: 'osm',
  STAMEN: {
    TERRAIN: 'stamen.terrain',
    TONER: 'stamen.toner',
    WATERCOLOR: 'stamen.watercolor',
  },
};

/**
 * Constant containing all the sources in the order preferred on the UI.
 */
export const Sources = [Source.OSM, Source.STAMEN.TERRAIN];

if (APIKeys.MAPBOX) {
  Sources.push(Source.MAPBOX.STATIC, Source.MAPBOX.SATELLITE);
  // MAPBOX.VECTOR does not look great with OpenLayers -- we would need the
  // Mapbox GL JS library :(
}

if (APIKeys.MAPTILER) {
  Sources.push(
    Source.MAPTILER.BASIC,
    Source.MAPTILER.SATELLITE,
    Source.MAPTILER.HYBRID
  );
}

/* Nextzen tiles do not look nice because we don't have a styling function for it */

/* Google and Bing Maps cannot be used in commercial apps without licensing */

if (APIKeys.BING) {
  Sources.push(Source.BING_MAPS.AERIAL_WITH_LABELS, Source.BING_MAPS.ROAD);
}

if (APIKeys.GOOGLE) {
  Sources.push(Source.GOOGLE_MAPS.DEFAULT, Source.GOOGLE_MAPS.SATELLITE);
}

const attributions = {
  mapbox: [
    '© <a href="https://www.mapbox.com/map-feedback/">Mapbox</a>',
    '© <a href="https://www.openstreetmap.org/copyright">' +
      'OpenStreetMap contributors</a>',
  ],
  maptiler: [
    '© <a href="https://www.maptiler.com/copyright/">Maptiler</a>',
    '© <a href="https://www.openstreetmap.org/copyright">' +
      'OpenStreetMap contributors</a>',
  ],
  nextzen:
    'Map data &copy; OpenStreetMap contributors, Who’s On First, ' +
    'Natural Earth, and openstreetmapdata.com',
  stamen: [
    'Map tiles by <a href="https://stamen.com/" target="_blank">Stamen ' +
      'Design</a>, under <a href="https://creativecommons.org/licenses/by/3.0/" ' +
      'target="_blank">CC BY 3.0</a>.',
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  ],
};

/**
 * Object mapping source constants to their visual properties (labels,
 * icons etc) on the user interface.
 *
 * @type {Object}
 */
const visualRepresentationsForSources = {
  [Source.BING_MAPS.AERIAL_WITH_LABELS]: {
    label: 'Bing Maps (aerial with labels)',
  },
  [Source.BING_MAPS.ROAD]: { label: 'Bing Maps (road)' },
  [Source.GOOGLE_MAPS.DEFAULT]: { label: 'Google Maps' },
  [Source.GOOGLE_MAPS.SATELLITE]: { label: 'Google Maps (satellite)' },
  [Source.MAPBOX.STATIC]: {
    label: 'Mapbox',
    attributions: attributions.mapbox,
  },
  [Source.MAPBOX.SATELLITE]: {
    label: 'Mapbox satellite',
    attributions: attributions.mapbox,
  },
  [Source.MAPBOX.VECTOR]: {
    label: 'Mapbox vector',
    attributions: attributions.mapbox,
  },
  [Source.MAPTILER.BASIC]: {
    label: 'Maptiler',
    attributions: attributions.maptiler,
  },
  [Source.MAPTILER.HYBRID]: {
    label: 'Maptiler hybrid',
    attributions: attributions.maptiler,
  },
  [Source.MAPTILER.SATELLITE]: {
    label: 'Maptiler satellite',
    attributions: attributions.maptiler,
  },
  [Source.MAPTILER.STREETS]: {
    label: 'Maptiler streets',
    attributions: attributions.maptiler,
  },
  [Source.NEXTZEN]: { label: 'Nextzen', attributions: attributions.nextzen },
  [Source.OSM]: { label: 'OpenStreetMap' },
  [Source.STAMEN.TERRAIN]: {
    label: 'Stamen terrain',
    attributions: attributions.stamen,
  },
  [Source.STAMEN.TONER]: {
    label: 'Stamen toner',
    attributions: attributions.stamen,
  },
  [Source.STAMEN.WATERCOLOR]: {
    label: 'Stamen watercolor',
    attributions: attributions.stamen,
  },
};

/**
 * Returns a human-readable label describing the given map source on the
 * user interface.
 *
 * @param  {string} source  the map source; must be one of the constants
 *         from the {@link Source} enum
 * @return {string} a human-readable description of the map source
 */
export function labelForSource(source) {
  const visualRep = visualRepresentationsForSources[source];
  return visualRep ? visualRep.label : 'unknown';
}

/**
 * Returns an array of strings that should be used as attributions with the
 * map source.
 *
 * @param  {string} source  the map source; must be one of the constants
 *         from the {@link Source} enum
 * @return {string[]} an array of attributions for the source
 */
export function attributionsForSource(source) {
  const visualRep = visualRepresentationsForSources[source];
  const result = visualRep ? visualRep.attributions : undefined;

  if (Array.isArray(result)) {
    return result;
  }

  if (result) {
    return [result];
  }

  return undefined;
}
