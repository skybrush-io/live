import React from 'react'

import { Provider as StoreProvider } from 'react-redux'
import injectTapEventPlugin from 'react-tap-event-plugin'

import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

import ClockDisplayList from './components/ClockDisplayList'
import ConnectionList from './components/ConnectionList'
import GlobalErrorDialog from './components/GlobalErrorDialog'
import GlobalSnackbar from './components/GlobalSnackbar'
import HotkeyHandler from './components/HotkeyHandler'
import LayersDialog from './components/map/LayersDialog'
import MapToolbar from './components/map/MapToolbar'
import MapView from './components/map/MapView'
import MessagesDialog from './components/MessagesDialog'
import ServerConnectionManager from './components/ServerConnectionManager'
import ServerSettingsDialog from './components/ServerSettingsDialog'
import UAVToolbar from './components/map/UAVToolbar'
import Widget from './components/Widget'

import hotkeys from './hotkeys'
import flock from './flock'
import store from './store'
import theme from './theme'

require('../assets/css/screen.less')
require('../assets/css/chat.less')
require('../assets/css/kbd.css')

// Enable tap events on the UI
injectTapEventPlugin()

/**
 * The main application component.
 */
export default class Application extends React.Component {
  render () {
    return (
      <StoreProvider store={store}>
        <MuiThemeProvider muiTheme={theme}>
          <div>
            <div id="canvas">
              <HotkeyHandler hotkeys={hotkeys}>
                <MapView />
              </HotkeyHandler>

              <Widget style={{ right: 8, bottom: 8, width: 300 }}>
                <ClockDisplayList />
              </Widget>

              <Widget style={{ right: 8, top: 8, width: 300 }}>
                <ConnectionList />
              </Widget>

              <Widget style={{ top: 8, left: (8 + 24 + 8) }} showControls={false}>
                <MapToolbar />
              </Widget>

              <Widget style={{ top: 8 + 48 + 8 + 24 + 8, left: 8 }} showControls={false}>
                <UAVToolbar />
              </Widget>
            </div>

            <ServerSettingsDialog />
            <ServerConnectionManager />

            <LayersDialog />
            <MessagesDialog flock={flock} />

            <GlobalErrorDialog />
            <GlobalSnackbar />
          </div>
        </MuiThemeProvider>
      </StoreProvider>
    )
  }
}
