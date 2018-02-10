import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import AppBar from 'material-ui/AppBar'
import Dialog, { DialogContent } from 'material-ui/Dialog'
import Tabs, { Tab } from 'material-ui/Tabs'

import {
  closeAppSettingsDialog,
  setAppSettingsDialogTab
} from '../../actions/app-settings'

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the server settings.
 */
class AppSettingsDialogPresentation extends React.Component {
  render () {
    const { onClose, onTabSelected, open, selectedTab } = this.props
    return (
      <Dialog open={open} onClose={onClose} fullWidth>
        <AppBar position='static'>
          <Tabs value={selectedTab} onChange={onTabSelected} centered>
            <Tab value='display' label="Display" />
            <Tab value='uavs' label="UAVs" />
          </Tabs>
        </AppBar>
        <DialogContent><p>Contents come here</p></DialogContent>
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
