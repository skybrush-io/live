import React from 'react'

import { Provider as StoreProvider } from 'react-redux'
import injectTapEventPlugin from 'react-tap-event-plugin'

import Signal from 'mini-signals'

import getMuiTheme from 'material-ui/styles/getMuiTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

import ClockDisplayList from './components/ClockDisplayList'
import ConnectionList from './components/ConnectionList'
import GlobalErrorDialog from './components/GlobalErrorDialog'
import GlobalSnackbar from './components/GlobalSnackbar'
import LayersDialog from './components/map/LayersDialog'
import MapToolbar from './components/map/MapToolbar'
import MapView from './components/map/MapView'
import ServerConnectionManager from './components/ServerConnectionManager'
import ServerSettingsDialog from './components/ServerSettingsDialog'
import Widget from './components/Widget'

import HotkeyHandler from './components/HotkeyHandler'
import hotkeys from './hotkeys'

import flock from './flock'
import store from './store'

require('../assets/css/screen.less')
require('../assets/css/kbd.css')

// Enable tap events on the UI
injectTapEventPlugin()

/**
 * The Material UI theme that the application will use.
 */
const muiTheme = getMuiTheme({})

/**
 * Object containing the signals used in the application.
 *
 * @todo Ask Tamás where this should be declared.
 */
const signals = {
  mapReferenceRequestSignal: new Signal(),
  mapRotationResetSignal: new Signal(),
  fitAllFeaturesSignal: new Signal()
}

/**
 * Array containing the hotkey objects that are now connected to the Redux store.
 */
const appliedHotkeys = hotkeys(store, flock, signals)

/**
 * The main application component.
 */
export default class Application extends React.Component {
  render () {
    return (
      <StoreProvider store={store}>
        <MuiThemeProvider muiTheme={muiTheme}>
          <div>
            <div id="canvas">
              <HotkeyHandler hotkeys={appliedHotkeys}>
                <MapView flock={flock} mapReferenceRequestSignal={signals.mapReferenceRequestSignal} />
              </HotkeyHandler>

              <Widget style={{ right: 8, bottom: 8, width: 300 }}>
                <ClockDisplayList />
              </Widget>

              <Widget style={{ right: 8, top: 8, width: 300 }}>
                <ConnectionList />
              </Widget>

              <Widget style={{ top: 8, left: (8 + 24 + 8) }} showControls={false}>
                <MapToolbar signals={signals} />
              </Widget>
            </div>

            <ServerSettingsDialog />
            <ServerConnectionManager />

            <LayersDialog />

            <GlobalErrorDialog />
            <GlobalSnackbar />
          </div>
        </MuiThemeProvider>
      </StoreProvider>
    )
  }
}
