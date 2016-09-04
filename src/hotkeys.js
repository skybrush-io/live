/**
 * @file File for storing hotkey configuration.
 */

import { selectAllFeatures, clearSelectedFeatures,
  selectMapTool, selectMapSource } from './actions/map'
import { showLayersDialog } from './actions/layers'

import { Tool } from './components/map/tools'
import { Source } from './model/sources'

import store from './store'
import flock from './flock'
import signals from './signals'
import messageHub from './message-hub'

export default [
  // Drone selection hotkeys
  {
    description: 'Select all drones',
    on: 'down',
    keys: 'PlatMod + KeyA',
    action: () => { store.dispatch(selectAllFeatures(flock)) }
  },
  {
    description: 'Deselect all drones',
    on: 'down',
    keys: 'PlatMod + Shift + KeyA',
    action: () => { store.dispatch(clearSelectedFeatures()) }
  },

  // Tool hotkeys
  {
    description: 'Switch to Select tool',
    on: 'down',
    keys: 'PlatMod + KeyS',
    action: () => {
      store.dispatch(selectMapTool(Tool.SELECT))
    }
  },
  {
    description: 'Switch to Zoom tool',
    on: 'down',
    keys: 'PlatMod + KeyZ',
    action: () => {
      store.dispatch(selectMapTool(Tool.ZOOM))
    }
  },
  {
    description: 'Switch to Pan tool',
    on: 'down',
    keys: 'PlatMod + KeyP',
    action: () => {
      store.dispatch(selectMapTool(Tool.PAN))
    }
  },

  // Map view adjustment hotkeys
  {
    description: 'Reset map rotation',
    on: 'down',
    keys: 'PlatMod + KeyR',
    action: () => {
      signals.mapRotationResetSignal.dispatch()
    }
  },
  {
    description: 'Fit all features into view',
    on: 'down',
    keys: 'PlatMod + KeyF',
    action: () => {
      signals.fitAllFeaturesSignal.dispatch()
    }
  },

  // Layer source hotkeys
  {
    description: 'Switch to OpenStreetMaps source',
    on: 'down',
    keys: 'PlatMod + KeyO',
    action: () => {
      store.dispatch(selectMapSource({layerId: 'base', source: Source.OSM}))
    }
  },
  {
    description: 'Switch to Bing Maps Aerial with Labels source',
    on: 'down',
    keys: 'PlatMod + KeyB',
    action: () => {
      store.dispatch(selectMapSource({layerId: 'base', source: Source.BING_MAPS.AERIAL_WITH_LABELS}))
    }
  },
  {
    description: 'Switch to Bing Maps Road source',
    on: 'down',
    keys: 'PlatMod + Alt + KeyB',
    action: () => {
      store.dispatch(selectMapSource({layerId: 'base', source: Source.BING_MAPS.ROAD}))
    }
  },

  {
    description: 'Open Layers dialog',
    on: 'down',
    keys: 'PlatMod + Shift + KeyL',
    action: () => {
      store.dispatch(showLayersDialog())
    }
  },

  // UAV Control hotkeys
  {
    description: 'Issue TAKEOFF command to selected UAVs',
    on: 'down',
    keys: 'PlatMod + Alt + KeyT',
    action: () => {
      messageHub.sendMessage({
        type: 'UAV-TAKEOFF',
        ids: store.getState().map.selection
      }).then(result => console.log(result))
    }
  },
  {
    description: 'Issue LAND command to selected UAVs',
    on: 'down',
    keys: 'PlatMod + Alt + KeyL',
    action: () => {
      messageHub.sendMessage({
        type: 'UAV-LAND',
        ids: store.getState().map.selection
      }).then(result => console.log(result))
    }
  },
  {
    description: 'Issue RTH (Return To Home) command to selected UAVs',
    on: 'down',
    keys: 'PlatMod + Alt + KeyR',
    action: () => {
      messageHub.sendMessage({
        type: 'UAV-RTH',
        ids: store.getState().map.selection
      }).then(result => console.log(result))
    }
  },

  // Clear localStorage and reload
  {
    description: 'Clear localStorage and reload',
    on: 'down',
    keys: 'PlatMod + Alt + KeyC',
    action: () => {
      if (window.confirm('Are you sure? All settings will be lost.')) {
        window.localStorage.clear()
        window.location.reload()
      }
    }
  }
]
