/**
 * @file File for storing hotkey configuration.
 */

import { showSnackbarMessage } from './actions/snackbar'

import { selectAllFeatures, clearSelectedFeatures,
  selectMapTool, selectMapSource } from './actions/map'

import { Tool } from './components/map/tools'
import { Source } from './components/map/sources'

export default (store, flock) => [
  // Complex hotkey example
  {
    on: 'down',
    keys: 'Ctrl + Shift + Alt + KeyA',
    action: () => {
      store.dispatch(showSnackbarMessage('Ctrl + Shift + Alt + A pressed.'))
    }
  },
  {
    on: 'up',
    keys: 'Ctrl + Shift + Alt + KeyA',
    action: () => {
      store.dispatch(showSnackbarMessage('Ctrl + Shift + Alt + A released.'))
    }
  },

  // Drone selection hotkeys
  {
    on: 'down',
    keys: 'PlatMod + KeyA',
    action: () => { store.dispatch(selectAllFeatures(flock)) }
  },
  {
    on: 'down',
    keys: 'PlatMod + Shift + KeyA',
    action: () => { store.dispatch(clearSelectedFeatures()) }
  },

  // Tool hotkeys
  {
    on: 'down',
    keys: 'PlatMod + KeyS', // Switch to Select tool
    action: () => {
      store.dispatch(selectMapTool(Tool.SELECT))
    }
  },
  {
    on: 'down',
    keys: 'PlatMod + KeyZ', // Switch to Zoom tool
    action: () => {
      store.dispatch(selectMapTool(Tool.ZOOM))
    }
  },
  {
    on: 'down',
    keys: 'PlatMod + KeyP', // Switch to Pan tool
    action: () => {
      store.dispatch(selectMapTool(Tool.PAN))
    }
  },

  // Layer source hotkeys
  {
    on: 'down',
    keys: 'PlatMod + KeyO', // Switch to OpenStreetMaps source
    action: () => {
      store.dispatch(selectMapSource(Source.OSM))
    }
  },
  {
    on: 'down',
    keys: 'PlatMod + KeyB', // Switch to Bing Maps Aerial with Labels source
    action: () => {
      store.dispatch(selectMapSource(Source.BING_MAPS.AERIAL_WITH_LABELS))
    }
  },
  {
    on: 'down',
    keys: 'PlatMod + Alt + KeyB', // Switch to Bing Maps Road source
    action: () => {
      store.dispatch(selectMapSource(Source.BING_MAPS.ROAD))
    }
  }
]
