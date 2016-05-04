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
        <TextField {...hostName} floatingLabelText="Hostname" spellCheck="false" /><br/>
        <TextField {...port} floatingLabelText="Port" spellCheck="false" />
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
},
state => ({               // mapStateToProps
  initialValues: state.serverSettings
}))(ServerSettingsFormPresentation)

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the server settings.
 */
class ServerSettingsDialogPresentation extends React.Component {
  constructor (props) {
    super(props)
    this.handleSubmit = this.handleSubmit.bind(this)
  }

  handleSubmit () {
    this.refs.form.submit()
  }

  render () {
    const { onClose, onSubmit, open } = this.props
    const actions = [
      <FlatButton label="Connect" primary={true} onTouchTap={this.handleSubmit} />,
      <FlatButton label="Close" onTouchTap={onClose} />
    ]
    const contentStyle = {
      width: '320px'
    }
    return (
      <Dialog title="Server Settings" modal={true} open={open}
              actions={actions} contentStyle={contentStyle}>
        <ServerSettingsForm ref="form" onSubmit={onSubmit} />
      </Dialog>
    )
  }
}

ServerSettingsDialogPresentation.propTypes = {
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
  state => ({            // mapStateToProps
    open: state.serverSettings.dialogVisible
  }),
  dispatch => ({
    onClose () {
      dispatch(closeServerSettingsDialog())
    },
    onSubmit (data) {
      dispatch(closeServerSettingsDialog(data))
    }
  })
)(ServerSettingsDialogPresentation)

export default ServerSettingsDialog
