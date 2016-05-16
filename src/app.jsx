import React from 'react'
import { Provider as StoreProvider } from 'react-redux'

import IconButton from 'material-ui/IconButton'
import Paper from 'material-ui/Paper'

import injectTapEventPlugin from 'react-tap-event-plugin'

import ContentClear from 'material-ui/svg-icons/content/clear'

import getMuiTheme from 'material-ui/styles/getMuiTheme'
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider'

import ClockDisplayList from './components/ClockDisplayList'
import ConnectionList from './components/ConnectionList'
import GlobalErrorDialog from './components/GlobalErrorDialog'
import GlobalSnackbar from './components/GlobalSnackbar'
import MapView from './components/MapView'
import ServerConnectionManager from './components/ServerConnectionManager'
import ServerSettingsDialog from './components/ServerSettingsDialog'

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
              <MapView />

              <Paper className="widget" style={{ 'right': 20, 'bottom': 20, 'width': 300 }}>
                <div className="widget-action-bar">
                  <IconButton><ContentClear/></IconButton>
                </div>
                <ClockDisplayList />
              </Paper>

              <Paper className="widget"
                     style={{ 'right': 20, 'top': 20, 'width': 300 }}>
                <div className="widget-action-bar">
                  <IconButton><ContentClear/></IconButton>
                </div>
                <ConnectionList />
              </Paper>
            </div>

            <ServerSettingsDialog/>
            <ServerConnectionManager/>

            <GlobalErrorDialog/>
            <GlobalSnackbar/>
          </div>
        </MuiThemeProvider>
      </StoreProvider>
    )
  }
}
