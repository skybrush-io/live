/**
 * @file Constants and routines related to the source types that the user
 * can use on the map.
 */

/**
 * Enum containing constants for the source types that the user can use on the map.
 */
export const Source = {
  OSM: 'osm',
  BING_MAPS: {
    AERIAL_WITH_LABELS: 'bingMaps.aerialWithLabels',
    ROAD: 'bingMaps.road'
  },
  GOOGLE_MAPS: {
    DEFAULT: 'googleMaps.default',
    SATELLITE: 'googleMaps.satellite',
    ROADS: 'googleMaps.roads'
  }
};

/**
 * Constant containing all the sources in the order preferred on the UI.
 */
export const Sources = [
  Source.OSM,
  Source.GOOGLE_MAPS.DEFAULT,
  Source.GOOGLE_MAPS.SATELLITE,
  Source.BING_MAPS.AERIAL_WITH_LABELS,
  Source.BING_MAPS.ROAD
];

/**
 * Object mapping source constants to their visual properties (labels,
 * icons etc) on the user interface.
 *
 * @type {Object}
 */
const visualRepresentationsForSources = {};
visualRepresentationsForSources[Source.OSM] = {
  label: 'OpenStreetMap'
};
visualRepresentationsForSources[Source.BING_MAPS.AERIAL_WITH_LABELS] = {
  label: 'Bing Maps (aerial with labels)'
};
visualRepresentationsForSources[Source.BING_MAPS.ROAD] = {
  label: 'Bing Maps (road)'
};
visualRepresentationsForSources[Source.GOOGLE_MAPS.DEFAULT] = {
  label: 'Google Maps'
};
visualRepresentationsForSources[Source.GOOGLE_MAPS.SATELLITE] = {
  label: 'Google Maps (satellite)'
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
  return visualRepresentationsForSources[source].label;
}
