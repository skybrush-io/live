/**
 * @file File for storing hotkey configuration.
 */

import { showLayersDialog } from './actions/layers'
import { selectAllUAVFeatures, clearSelection,
  selectMapTool, selectMapSource } from './actions/map'
import { showMessagesDialog } from './actions/messages'
import { showSnackbarMessage } from './actions/snackbar'

import flock from './flock'
import { Source } from './model/sources'
import { getSelectedUAVIds } from './selectors/selection'
import {
  fitAllFeaturesSignal,
  focusMessagesDialogUAVSelectorFieldSignal,
  mapRotationResetSignal
} from './signals'
import store, { clearStore } from './store'
import {
  takeoffUAVs, landUAVs, returnToHomeUAVs, toggleErrorUAVs
} from './utils/messaging'
import { Tool } from './views/map/tools'

import copy from 'copy-to-clipboard'

export default [
  // Drone selection hotkeys
  {
    description: 'Select all drones',
    on: 'down',
    keys: 'PlatMod + KeyA',
    action: () => { store.dispatch(selectAllUAVFeatures(flock)) }
  },
  {
    description: 'Clear selection',
    on: 'down',
    keys: 'PlatMod + Shift + KeyA',
    action: () => { store.dispatch(clearSelection()) }
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

  // Copy the actual coordinates of the cursor
  {
    description: 'Copy coordinates to clipboard',
    on: 'down',
    keys: 'PlatMod + Shift + KeyC',
    action: () => {
      const displays = document.getElementsByClassName('ol-mouse-position')
      const text = (displays && displays.length > 0) ? displays[0].innerText : undefined
      if (text) {
        copy(text.split('\n')[0])
        store.dispatch(showSnackbarMessage('Coordinates copied to clipboard.'))
      }
    }
  },

  // Map view adjustment hotkeys
  {
    description: 'Reset map rotation',
    on: 'down',
    keys: 'PlatMod + KeyR',
    action: () => {
      mapRotationResetSignal.dispatch()
    }
  },
  {
    description: 'Fit all features into view',
    on: 'down',
    keys: 'PlatMod + KeyF',
    action: () => {
      fitAllFeaturesSignal.dispatch()
    }
  },

  // Layer related hotkeys
  {
    description: 'Switch to OpenStreetMaps source',
    on: 'down',
    keys: 'PlatMod + KeyO',
    action: () => {
      store.dispatch(selectMapSource({ layerId: 'base', source: Source.OSM }))
    }
  },
  {
    description: 'Switch to Bing Maps Aerial with Labels source',
    on: 'down',
    keys: 'PlatMod + KeyB',
    action: () => {
      store.dispatch(selectMapSource({ layerId: 'base', source: Source.BING_MAPS.AERIAL_WITH_LABELS }))
    }
  },
  {
    description: 'Switch to Bing Maps Road source',
    on: 'down',
    keys: 'PlatMod + Alt + KeyB',
    action: () => {
      store.dispatch(selectMapSource({ layerId: 'base', source: Source.BING_MAPS.ROAD }))
    }
  },

  {
    description: 'Open the Layers dialog',
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
    action: () => takeoffUAVs(getSelectedUAVIds(store.getState()))
  },
  {
    description: 'Issue LAND command to selected UAVs',
    on: 'down',
    keys: 'PlatMod + Alt + KeyL',
    action: () => landUAVs(getSelectedUAVIds(store.getState()))
  },
  {
    description: 'Issue RTH (Return To Home) command to selected UAVs',
    on: 'down',
    keys: 'PlatMod + Alt + KeyR',
    action: () => returnToHomeUAVs(getSelectedUAVIds(store.getState()))
  },

  // Temporary: Send selected UAVs into a random error state
  {
    description: 'Send selected UAVs into a random error state',
    on: 'down',
    keys: 'PlatMod + Alt + KeyE',
    action: () => toggleErrorUAVs(getSelectedUAVIds(store.getState()))
  },

  // Messages dialog related hotkeys
  {
    description: 'Open the Messages dialog and focus the UAV selector field',
    on: 'down',
    keys: '@',
    action: () => {
      store.dispatch(showMessagesDialog())
      focusMessagesDialogUAVSelectorFieldSignal.dispatch()
    }
  },

  // Clear stored settings and reload
  {
    description: 'Clear stored settings and reload',
    on: 'down',
    keys: 'PlatMod + Alt + KeyC',
    action: () => {
      if (window.confirm('Are you sure? All settings will be lost.')) {
        clearStore()
        window.localStorage.clear()
        window.location.reload()
      }
    }
  }
]
