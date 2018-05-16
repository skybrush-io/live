import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { FormGroup } from 'material-ui/Form'
import List, { ListItem, ListItemText } from 'material-ui/List'
import Switch from 'material-ui/Switch'
import TextField from 'material-ui/TextField'

import PathScanner from './PathScanner'

import {
  updateAppSettings
} from '../../../actions/app-settings'

const ServerTabPresentation = ({ cliArguments, enabled, onDisable, onEnable, onTextFieldChanged }) => (
  <React.Fragment>
    <List dense disablePadding style={{ margin: '0 -24px' }}>
      <PathScanner />
      <ListItem button disableRipple onClick={enabled ? onDisable : onEnable}>
        <Switch checked={enabled} />
        <ListItemText primary='Launch local server at startup'
          secondary='Local server will be launched only if the application
          is set to connect to localhost' />
      </ListItem>
    </List>
    <FormGroup>
      <TextField id='arguments' label='Command line arguments'
        value={cliArguments} fullWidth
        helperText={'These arguments will be supplied to the local server ' +
          'upon startup.'}
        onChange={onTextFieldChanged} />
    </FormGroup>
  </React.Fragment>
)

ServerTabPresentation.propTypes = {
  cliArguments: PropTypes.string,
  enabled: PropTypes.bool,
  onCheckboxToggled: PropTypes.func,
  onDisable: PropTypes.func,
  onEnable: PropTypes.func,
  onTextFieldChanged: PropTypes.func,
  searchPath: PropTypes.arrayOf(PropTypes.string)
}

export default connect(
  // mapStateToProps
  state => state.settings.localServer,
  // mapDispatchToProps
  dispatch => ({
    onCheckboxToggled (event) {
      dispatch(updateAppSettings(
        'localServer',
        { [event.target.name]: event.target.checked }
      ))
    },

    onDisable () {
      dispatch(updateAppSettings('localServer', { 'enabled': false }))
    },

    onEnable () {
      dispatch(updateAppSettings('localServer', { 'enabled': true }))
    },

    onTextFieldChanged (event) {
      dispatch(updateAppSettings(
        'localServer',
        { [event.target.id]: event.target.value }
      ))
    }
  })
)(ServerTabPresentation)
