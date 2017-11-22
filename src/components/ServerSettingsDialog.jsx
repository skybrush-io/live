/**
 * @file Dialog that shows the server settings and allows the user to
 * edit it.
 */

import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { change, reduxForm, Field } from 'redux-form'

import Button from 'material-ui/Button'
import Dialog from 'material-ui/Dialog'

import { closeServerSettingsDialog } from '../actions/server-settings'
import { createValidator, between, integer, required } from '../utils/validation'
import { renderTextField } from './helpers/reduxFormRenderers'

/**
 * Presentation of the form that shows the fields that the user can use to
 * edit the server settings.
 */
class ServerSettingsFormPresentation extends React.Component {
  render () {
    return (
      <div onKeyPress={this.props.onKeyPress}>
        <Field
          name='hostName'
          component={renderTextField}
          floatingLabelText='Hostname'
        />
        <br />
        <Field
          name='port'
          component={renderTextField}
          floatingLabelText='Port'
        />
      </div>
    )
  }
}

ServerSettingsFormPresentation.propTypes = {
  onKeyPress: PropTypes.func
}

/**
 * Container of the form that shows the fields that the user can use to
 * edit the server settings.
 */
const ServerSettingsForm = connect(
  // mapStateToProps
  state => ({
    initialValues: state.dialogs.serverSettings
  }), null, null, { withRef: true }
)(reduxForm({
  form: 'serverSettings',
  validate: createValidator({
    hostName: required,
    port: [required, integer, between(1, 65535)]
  })
})(ServerSettingsFormPresentation))

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the server settings.
 */
class ServerSettingsDialogPresentation extends React.Component {
  constructor (props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
    this._handleKeyPress = this._handleKeyPress.bind(this)
  }

  handleSubmit () {
    this.refs.form.getWrappedInstance().submit()
  }

  _handleKeyPress (e) {
    if (e.nativeEvent.code === 'Enter') {
      this.handleSubmit()
    }
  }

  render () {
    const { autoSetServer, onClose, onSubmit, open } = this.props
    const actions = [
      <Button key='connect' color='primary' onClick={this.handleSubmit}>Connect</Button>,
      <Button key='auto' onClick={autoSetServer}>Auto</Button>,
      <Button key='close' onClick={onClose}>Close</Button>
    ]
    const contentStyle = {
      width: '320px'
    }
    return (
      <Dialog title='Server Settings' open={open}
        actions={actions} contentStyle={contentStyle}
        onRequestClose={onClose}
      >
        <ServerSettingsForm ref='form'
          onSubmit={onSubmit}
          onKeyPress={this._handleKeyPress} />
      </Dialog>
    )
  }
}

ServerSettingsDialogPresentation.propTypes = {
  autoSetServer: PropTypes.func,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
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
  // mapStateToProps
  state => ({
    open: state.dialogs.serverSettings.dialogVisible
  }),
  // mapDispatchToProps
  dispatch => ({
    onClose () {
      dispatch(closeServerSettingsDialog())
    },
    onSubmit (data) {
      // Cast the port into a number first, then dispatch the action
      data.port = Number(data.port)
      dispatch(closeServerSettingsDialog(data))
    },
    autoSetServer () {
      dispatch(change('serverSettings', 'hostName', window.location.hostname))
      dispatch(change('serverSettings', 'port', '5000'))
    }
  })
)(ServerSettingsDialogPresentation)

export default ServerSettingsDialog
