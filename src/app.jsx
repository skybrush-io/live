import Reboot from 'material-ui/Reboot'
import { MuiThemeProvider } from 'material-ui/styles'
import PropTypes from 'prop-types'
import React from 'react'
import { WorkbenchView } from 'react-flexible-workbench'
import { compose, withContext, withProps } from 'recompose'

import GlobalErrorDialog from './components/GlobalErrorDialog'
import GlobalSnackbar from './components/GlobalSnackbar'
import HotkeyHandler from './components/HotkeyHandler'
import LayersDialog from './components/map/LayersDialog'
import MessagesDialog from './components/MessagesDialog'
import SavedLocationEditorDialog from './components/SavedLocationEditorDialog'
import ServerConnectionManager from './components/ServerConnectionManager'
import ServerSettingsDialog from './components/ServerSettingsDialog'
import Sidebar from './components/Sidebar'

import flock from './flock'
import { withErrorBoundary, wrapWith } from './hoc'
import hotkeys from './hotkeys'
import store from './store'
import theme from './theme'
import workbench from './workbench'

require('../assets/css/screen.less')
require('../assets/css/chat.less')
require('../assets/css/kbd.css')

const rootStyle = {
  display: 'flex',
  width: '100%',
  height: '100%'
}

/**
 * The main application component, without the execution context (flock,
 * store and Material UI theme).
 */
class Application extends React.Component {
  render () {
    return (
      <div>
		<Reboot />

        <HotkeyHandler hotkeys={hotkeys}>
          <div style={rootStyle}>
            <Sidebar workbench={workbench} />
            <WorkbenchView workbench={workbench} />
          </div>
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
}

/**
 * The context provider for the main application component and the
 * individual application panels.
 */
const enhancer = compose(
  withContext(
    {
      flock: PropTypes.object.isRequired,
      store: PropTypes.object.isRequired
    },
    props => ({ flock, store })
  ),
  withErrorBoundary,
  wrapWith(
    withProps({ theme })(MuiThemeProvider)
  )
)

workbench.hoc = enhancer
export default enhancer(Application)
