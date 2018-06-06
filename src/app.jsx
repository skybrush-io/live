import CssBaseline from '@material-ui/core/CssBaseline'
import { MuiThemeProvider } from '@material-ui/core/styles'
import PropTypes from 'prop-types'
import React from 'react'
import { WorkbenchView } from 'react-flexible-workbench'
import { compose, withContext, withProps } from 'recompose'

import dialogs from './components/dialogs'
import GlobalSnackbar from './components/GlobalSnackbar'
import HotkeyHandler from './components/HotkeyHandler'
import ServerConnectionManager from './components/ServerConnectionManager'
import Sidebar from './components/sidebar/Sidebar'

import flock from './flock'
import { withErrorBoundary, wrapWith } from './hoc'
import hotkeys from './hotkeys'
import store from './store'
import theme from './theme'
import workbench from './workbench'

require('../assets/css/screen.less')
require('../assets/css/chat.less')
require('../assets/css/kbd.css')

require('typeface-roboto')

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
        <CssBaseline />

        <HotkeyHandler hotkeys={hotkeys} />

        <div style={rootStyle}>
          <Sidebar workbench={workbench} />
          <WorkbenchView workbench={workbench} />
        </div>

        <ServerConnectionManager />

        <dialogs.AppSettingsDialog />
        <dialogs.FeatureEditorDialog />
        <dialogs.GlobalErrorDialog />
        <dialogs.LayerSettingsDialog />
        <dialogs.MessagesDialog flock={flock} />
        <dialogs.PromptDialog />
        <dialogs.SavedLocationEditorDialog />
        <dialogs.ServerSettingsDialog />

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
