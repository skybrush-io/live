/**
 * @file File for storing hotkey configuration.
 */

import { showSnackbarMessage } from './actions/snackbar'

import { selectAllFeatures, clearSelectedFeatures,
  selectMapTool, selectMapSource } from './actions/map'

import { Tool } from './components/map/tools'
import { Source } from './components/map/sources'

export default (store) => [
  // Complex hotkey example
  {
    keys: 'Ctrl + Shift + Alt + KeyA',
    action: () => {
      store.dispatch(showSnackbarMessage('Ctrl + Shift + Alt + A pressed.'))
    }
  },

  // Drone selection hotkeys
  {
    keys: 'PlatMod + KeyA',
    action: () => { store.dispatch(selectAllFeatures()) }
  },
  {
    keys: 'PlatMod + Shift + KeyA',
    action: () => { store.dispatch(clearSelectedFeatures()) }
  },

  // Tool hotkeys
  {
    keys: 'PlatMod + KeyS', // Switch to Select tool
    action: () => {
      store.dispatch(selectMapTool(Tool.SELECT))
    }
  },
  {
    keys: 'PlatMod + KeyZ', // Switch to Zoom tool
    action: () => {
      store.dispatch(selectMapTool(Tool.ZOOM))
    }
  },
  {
    keys: 'PlatMod + KeyP', // Switch to Pan tool
    action: () => {
      store.dispatch(selectMapTool(Tool.PAN))
    }
  },

  // Layer source hotkeys
  {
    keys: 'PlatMod + KeyO', // Switch to OpenStreetMaps source
    action: () => {
      store.dispatch(selectMapSource(Source.OSM))
    }
  },
  {
    keys: 'PlatMod + KeyB', // Switch to Bing Maps Aerial with Labels source
    action: () => {
      store.dispatch(selectMapSource(Source.BING_MAPS.AERIAL_WITH_LABELS))
    }
  },
  {
    keys: 'PlatMod + Alt + KeyB', // Switch to Bing Maps Road source
    action: () => {
      store.dispatch(selectMapSource(Source.BING_MAPS.ROAD))
    }
  }
]
