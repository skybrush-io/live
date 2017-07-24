import React, { PropTypes } from 'react'

import injectTapEventPlugin from 'react-tap-event-plugin'
import { withContext } from 'recompose'

import GlobalErrorDialog from './components/GlobalErrorDialog'
import GlobalSnackbar from './components/GlobalSnackbar'
import HotkeyHandler from './components/HotkeyHandler'
import LayersDialog from './components/map/LayersDialog'
import MessagesDialog from './components/MessagesDialog'
import SavedLocationEditorDialog from './components/SavedLocationEditorDialog'
import ServerConnectionManager from './components/ServerConnectionManager'
import ServerSettingsDialog from './components/ServerSettingsDialog'
import Workbench from './components/Workbench'

import flock from './flock'
import hotkeys from './hotkeys'
import store from './store'
import muiTheme from './theme'

require('../assets/css/screen.less')
require('../assets/css/chat.less')
require('../assets/css/kbd.css')

// Enable tap events on the UI
injectTapEventPlugin()

/**
 * The main application component, without the execution context (flock,
 * store and Material UI theme).
 */
class Application extends React.Component {
  render () {
    return (
      <div>
        <HotkeyHandler hotkeys={hotkeys}>
          <Workbench />
        </HotkeyHandler>

        <SavedLocationEditorDialog />

        <ServerSettingsDialog />
        <ServerConnectionManager />

        <LayersDialog />
        <MessagesDialog flock={flock} />

        <GlobalErrorDialog />
        <GlobalSnackbar />
      </div>
    )
  }

/*
  <Widget style={{ top: 8, left: (8 + 24 + 8) }} showControls={false}>
    <MapToolbar />
  </Widget>
*/

}

/**
 * The context provider for the main application component.
 */
const contextProvider = withContext(
  {
    flock: PropTypes.object.isRequired,
    muiTheme: PropTypes.object.isRequired,
    store: PropTypes.object.isRequired
  },
  props => ({ flock, muiTheme, store })
)

export default contextProvider(Application)
