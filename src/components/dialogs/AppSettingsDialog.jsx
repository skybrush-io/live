import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import AppBar from 'material-ui/AppBar'
import Checkbox from 'material-ui/Checkbox'
import Dialog, { DialogContent } from 'material-ui/Dialog'
import { FormControlLabel, FormGroup } from 'material-ui/Form'
import Tabs, { Tab } from 'material-ui/Tabs'

import {
  closeAppSettingsDialog,
  setAppSettingsDialogTab,
  updateAppSettings
} from '../../actions/app-settings'

const DisplayTabPresentation = props => (
  <FormGroup>
    <FormControlLabel label="Show mouse coordinates"
      control={<Checkbox checked={props.showMouseCoordinates}
        name='showMouseCoordinates'
        onChange={props.onCheckboxToggled} />} />
    <FormControlLabel label="Show scale line"
      control={<Checkbox checked={props.showScaleLine}
        name='showScaleLine'
        onChange={props.onCheckboxToggled} />} />
  </FormGroup>
)

DisplayTabPresentation.propTypes = {
  onCheckboxToggled: PropTypes.func,
  showMouseCoordinates: PropTypes.bool,
  showScaleLine: PropTypes.bool
}

const DisplayTab = connect(
  // mapStateToProps
  state => state.settings.display,
  // mapDispatchToProps
  dispatch => ({
    onCheckboxToggled (event) {
      dispatch(updateAppSettings(
        'display',
        { [event.target.name]: event.target.checked }
      ))
    }
  })
)(DisplayTabPresentation)

/* ===================================================================== */

const tabNameToComponent = {
  'display': <DisplayTab />,
  'uavs': null
}

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the app settings.
 */
class AppSettingsDialogPresentation extends React.Component {
  render () {
    const { onClose, onTabSelected, open, selectedTab } = this.props
    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
        <AppBar position='static'>
          <Tabs value={selectedTab} onChange={onTabSelected} centered>
            <Tab value='display' label="Display" />
            <Tab value='uavs' label="UAVs" />
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
