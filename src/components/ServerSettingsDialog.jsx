/**
 * @file Dialog that shows the server settings and allows the user to
 * edit it.
 */

import { autobind } from 'core-decorators'
import { partial } from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'
import { reduxForm, submit, Field } from 'redux-form'
import { TextField } from 'redux-form-material-ui'

import AppBar from 'material-ui/AppBar'
import Button from 'material-ui/Button'
import Dialog, { DialogActions, DialogContent } from 'material-ui/Dialog'
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'
import Tabs, { Tab } from 'material-ui/Tabs'

import EditIcon from 'material-ui-icons/Edit'
import LightbulbIcon from 'material-ui-icons/LightbulbOutline'
// import WifiIcon from 'material-ui-icons/Wifi'

import {
  closeServerSettingsDialog,
  setServerSettingsDialogTab
} from '../actions/server-settings'
import { createValidator, between, integer, required } from '../utils/validation'

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
          component={TextField}
          label='Hostname'
          margin='normal'
          fullWidth
        />
        <br />
        <Field
          name='port'
          component={TextField}
          label='Port'
          margin='normal'
          fullWidth
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
  })
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
  @autobind
  _handleKeyPress (e) {
    if (e.nativeEvent.code === 'Enter') {
      this.props.forceFormSubmission()
    }
  }

  render () {
    const { forceFormSubmission, onClose,
      onSubmit, onTabSelected, open, selectedTab } = this.props
    const actions = []
    const content = []

    switch (selectedTab) {
      case 'auto':
        content.push(
          <List key='autodetectionResultList' style={{ height: 160, overflow: 'scroll' }}>
            {/*
            <ListItem button>
              <ListItemIcon><WifiIcon /></ListItemIcon>
              <ListItemText primary='localhost:5000' secondary='Autodetected' />
            </ListItem>
            */}
            <ListItem button onClick={partial(onSubmit, { hostName: window.location.hostname, port: 5000 })}>
              <ListItemIcon><LightbulbIcon /></ListItemIcon>
              <ListItemText primary='localhost:5000' secondary='Inferred from URL' />
            </ListItem>
            <ListItem button onClick={partial(onTabSelected, null, 'manual')}>
              <ListItemIcon><EditIcon /></ListItemIcon>
              <ListItemText primary='Enter manually' />
            </ListItem>
          </List>,
          <DialogContent key='contents'>
            <p>Auto-discovery is not available in this version.</p>
          </DialogContent>
        )
        break

      case 'manual':
        content.push(
          <DialogContent key='contents'>
            <ServerSettingsForm onSubmit={onSubmit} onKeyPress={this._handleKeyPress} />
          </DialogContent>
        )
        actions.push(
          <Button key='connect' color='primary' onClick={forceFormSubmission}>Connect</Button>
        )
        break
    }

    actions.push(<Button key='close' onClick={onClose}>Close</Button>)

    return (
      <Dialog open={open} onClose={onClose} fullWidth maxWidth='xs'>
        <AppBar position='static'>
          <Tabs value={selectedTab} onChange={onTabSelected} fullWidth>
            <Tab value='auto' label="Autodetected" />
            <Tab value='manual' label="Manual" />
          </Tabs>
        </AppBar>
        {content}
        <DialogActions>{actions}</DialogActions>
      </Dialog>
    )
  }
}

ServerSettingsDialogPresentation.propTypes = {
  forceFormSubmission: PropTypes.func,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  onTabSelected: PropTypes.func,
  open: PropTypes.bool.isRequired,
  selectedTab: PropTypes.string
}

ServerSettingsDialogPresentation.defaultProps = {
  open: false,
  selectedTab: 'auto'
}

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the server settings.
 */
const ServerSettingsDialog = connect(
  // mapStateToProps
  state => ({
    open: state.dialogs.serverSettings.dialogVisible,
    selectedTab: state.dialogs.serverSettings.selectedTab
  }),
  // mapDispatchToProps
  dispatch => ({
    forceFormSubmission () {
      dispatch(submit('serverSettings'))
    },
    onClose () {
      dispatch(closeServerSettingsDialog())
    },
    onSubmit (data) {
      // Cast the port into a number first, then dispatch the action
      data.port = Number(data.port)
      dispatch(closeServerSettingsDialog({
        hostName: data.hostName,
        port: Number(data.port)
      }))
    },
    onTabSelected (event, value) {
      dispatch(setServerSettingsDialogTab(value))
    }
  })
)(ServerSettingsDialogPresentation)

export default ServerSettingsDialog
