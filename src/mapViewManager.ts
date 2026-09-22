/**
 * @file Defines the singleton MapViewManager instance that belongs to the
 * main map's view.
 */

import MapViewManager from './views/map/MapViewManager';

/**
 * The singleton MapViewManager instance for the main map view.
 */
const mapViewManager = new MapViewManager();

export default mapViewManager;
