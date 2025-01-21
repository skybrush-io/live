/* eslint-disable n/prefer-global/process */

/**
 * The default API keys that the app will use if the user did not specify their
 * own API keys.
 */
const APIKeys = {
  BING: process.env['SKYBRUSH_BING_MAPS_API_KEY'],
  GOOGLE: process.env['SKYBRUSH_GOOGLE_MAPS_API_KEY'],
  MAPBOX: process.env['SKYBRUSH_MAPBOX_API_KEY'],
  MAPTILER: process.env['SKYBRUSH_MAPTILER_API_KEY'],
  NEXTZEN: process.env['SKYBRUSH_NEXTZEN_API_KEY'],
};

export type APIKeysRecord = Record<keyof typeof APIKeys, string>;

export default APIKeys;
