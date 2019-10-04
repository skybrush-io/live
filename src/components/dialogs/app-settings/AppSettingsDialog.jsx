import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import AppBar from '@material-ui/core/AppBar'
import Dialog from '@material-ui/core/Dialog'
import DialogContent from '@material-ui/core/DialogContent'
import Tab from '@material-ui/core/Tab'
import Tabs from '@material-ui/core/Tabs'

import {
  closeAppSettingsDialog,
  setAppSettingsDialogTab
} from '../../../actions/app-settings'

import DisplayTab from './DisplayTab'
import ServerTab from './ServerTab'

/* ===================================================================== */

const tabNameToComponent = {
  display: <DisplayTab />,
  server: <ServerTab />,
  uavs: null
}

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the app settings.
 */
class AppSettingsDialogPresentation extends React.Component {
  render () {
    const { onClose, onTabSelected, open, selectedTab } = this.props
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth='sm'>
        <AppBar position='static'>
          <Tabs value={selectedTab} onChange={onTabSelected} centered>
            <Tab value='display' label="Display" />
            <Tab value='uavs' label="UAVs" />
            {window.isElectron ? <Tab value='server' label="Server" /> : null}
          </Tabs>
        </AppBar>
        <DialogContent>
          {tabNameToComponent[selectedTab]}
        </DialogContent>
      </Dialog>
    )
  }
}

AppSettingsDialogPresentation.propTypes = {
  onClose: PropTypes.func,
  onTabSelected: PropTypes.func,
  open: PropTypes.bool.isRequired,
  selectedTab: PropTypes.string
}

AppSettingsDialogPresentation.defaultProps = {
  open: false,
  selectedTab: 'auto'
}

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the server settings.
 */
const AppSettingsDialog = connect(
  // mapStateToProps
  state => state.dialogs.appSettings,
  // mapDispatchToProps
  dispatch => ({
    onClose () {
      dispatch(closeAppSettingsDialog())
    },
    onTabSelected (event, value) {
      dispatch(setAppSettingsDialogTab(value))
    }
  })
)(AppSettingsDialogPresentation)

export default AppSettingsDialog
