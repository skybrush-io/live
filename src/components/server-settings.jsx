/**
 * @file Dialog that shows the server settings and allows the user to
 * edit it.
 */

import React, { PropTypes } from 'react'
import { connect } from 'react-redux'
import { reduxForm } from 'redux-form'

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'
import TextField from 'material-ui/TextField'

import { closeServerSettingsDialog } from '../actions/server-settings'

/**
 * Presentation of the form that shows the fields that the user can use to
 * edit the server settings.
 */
class ServerSettingsFormPresentation extends React.Component {
  render () {
    const { fields: { hostName, port } } = this.props
    return (
      <div>
        <TextField {...hostName} floatingLabelText="Hostname" />
        <TextField {...port} floatingLabelText="Port" />
      </div>
    )
  }
}

ServerSettingsFormPresentation.propTypes = {
  fields: PropTypes.object.isRequired
}

/**
 * Container of the form that shows the fields that the user can use to
 * edit the server settings.
 */
const ServerSettingsForm = reduxForm({
  form: 'serverSettings',
  fields: ['hostName', 'port']
})(ServerSettingsFormPresentation)

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the server settings.
 */
class ServerSettingsDialogPresentation extends React.Component {
  render () {
    const actions = [
      <FlatButton label="Close" primary={true} onTouchTap={this.props.onClose} />
    ]
    return (
      <Dialog title="Server Settings" modal={true} open={this.props.open}
              actions={actions}>
        <ServerSettingsForm />
      </Dialog>
    )
  }
}

ServerSettingsDialogPresentation.propTypes = {
  onClose: PropTypes.func,
  open: PropTypes.bool.isRequired
}

ServerSettingsDialogPresentation.defaultProps = {
  open: false
}

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the server settings.
 */
const ServerSettingsDialog = connect(
  state => ({            // mapStateToProps
    open: state.serverSettings.dialogVisible
  }),
  dispatch => ({
    onClose () {
      dispatch(closeServerSettingsDialog())
    }
  })
)(ServerSettingsDialogPresentation)

export default ServerSettingsDialog
