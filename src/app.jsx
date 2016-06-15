import React from 'react'
import { Provider as StoreProvider } from 'react-redux'
import injectTapEventPlugin from 'react-tap-event-plugin'

import getMuiTheme from 'material-ui/styles/getMuiTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

import ClockDisplayList from './components/ClockDisplayList'
import ConnectionList from './components/ConnectionList'
import GlobalErrorDialog from './components/GlobalErrorDialog'
import GlobalSnackbar from './components/GlobalSnackbar'
import MapToolbar from './components/map/MapToolbar'
import MapView from './components/map/MapView'
import ServerConnectionManager from './components/ServerConnectionManager'
import ServerSettingsDialog from './components/ServerSettingsDialog'
import Widget from './components/Widget'

import flock from './flock'
import store from './store'

require('../assets/css/screen.less')

// Enable tap events on the UI
injectTapEventPlugin()

/**
 * The Material UI theme that the application will use.
 */
const muiTheme = getMuiTheme({})

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
              <MapView flock={flock} />

              <Widget style={{ 'right': 8, 'bottom': 8, 'width': 300 }}>
                <ClockDisplayList />
              </Widget>

              <Widget style={{ 'right': 8, 'top': 8, 'width': 300 }}>
                <ConnectionList />
              </Widget>

              <Widget style={{ 'top': 8, 'left': 41 }} showControls={false}>
                <MapToolbar />
              </Widget>
            </div>

            <ServerSettingsDialog />
            <ServerConnectionManager />

            <GlobalErrorDialog />
            <GlobalSnackbar />
          </div>
        </MuiThemeProvider>
      </StoreProvider>
    )
  }
}
