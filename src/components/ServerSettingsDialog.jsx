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
import { Switch, TextField } from 'redux-form-material-ui'

import AppBar from 'material-ui/AppBar'
import Button from 'material-ui/Button'
import { FormControlLabel } from 'material-ui/Form'
import { CircularProgress } from 'material-ui/Progress'
import Dialog, { DialogActions, DialogContent } from 'material-ui/Dialog'
import List, { ListItem, ListItemIcon, ListItemText } from 'material-ui/List'
import Tabs, { Tab } from 'material-ui/Tabs'

import EditIcon from 'material-ui-icons/Edit'
import LightbulbIcon from 'material-ui-icons/LightbulbOutline'
import WifiIcon from 'material-ui-icons/Wifi'

import {
  ServerDetectionManager,
  isServerDetectionSupported
} from './ServerDetectionManager'

import {
  closeServerSettingsDialog,
  setServerSettingsDialogTab
} from '../actions/server-settings'
import { getDetectedServersInOrder } from '../selectors'
import { createValidator, between, integer, required } from '../utils/validation'

// eslint-disable-next-line react/prop-types
const iconForServerItem = ({ type }) => (
  type === 'inferred' ? <LightbulbIcon /> : <WifiIcon />
)

const primaryTextForServerItem = ({ hostName, label, port }) => (
  label || `${hostName}:${port}`
)

const secondaryTextForServerItem = ({ protocol, type }) => (
  (protocol === 'sio+tls:' ? 'Secure connection' : 'Unencrypted connection') +
  (type === 'inferred' ? ', inferred from URL' : '')
)

const DetectedServersListPresentation = ({ isScanning, items, onItemSelected }) => (
  <List style={{ height: 160, overflow: 'scroll' }}>
    {isScanning && (!items || items.length === 0) ? (
      <ListItem key='__scanning'>
        <ListItemIcon><CircularProgress size={24} /></ListItemIcon>
        <ListItemText primary='Please wait...'
          secondary='Scanning network for servers...' />
      </ListItem>
    ) : null}
    {items.map(item => (
      <ListItem key={item.id} button onClick={partial(onItemSelected, item)}>
        <ListItemIcon>{iconForServerItem(item)}</ListItemIcon>
        <ListItemText primary={primaryTextForServerItem(item)}
          secondary={secondaryTextForServerItem(item)} />
      </ListItem>
    ))}
    <ListItem key='__manual' button onClick={partial(onItemSelected, null)}>
      <ListItemIcon><EditIcon /></ListItemIcon>
      <ListItemText primary='Enter manually' />
    </ListItem>
  </List>
)

DetectedServersListPresentation.propTypes = {
  isScanning: PropTypes.bool,
  items: PropTypes.array,
  onItemSelected: PropTypes.func
}

/**
 * Container of the list that shows the running servers that we have
 * detected on the network.
 */
const DetectedServersList = connect(
  // mapStateToProps
  state => ({
    isScanning: state.servers.isScanning,
    items: getDetectedServersInOrder(state)
  })
)(DetectedServersListPresentation)

const ServerSettingsFormPresentation = ({ onKeyPress }) => (
  <div onKeyPress={onKeyPress}>
    <Field name='hostName' label='Hostname' margin='normal'
      component={TextField} fullWidth />
    <Field name='port' label='Port' margin='normal'
      component={TextField} fullWidth />
    <FormControlLabel control={<Field name='isSecure' component={Switch} />}
      label="Use secure connection" />
  </div>
)

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

  @autobind
  _handleServerSelection (item) {
    if (item === null || item === undefined) {
      this.props.onTabSelected(null, 'manual')
    } else {
      this.props.onSubmit({
        ...item,
        isSecure: item.protocol === 'sio+tls:'
      })
    }
  }

  render () {
    const { forceFormSubmission, onClose, onSubmit,
      onTabSelected, open, selectedTab } = this.props
    const actions = []
    const content = []

    switch (selectedTab) {
      case 'auto':
        content.push(
          <ServerDetectionManager key='serverDetector' />,
          <DetectedServersList key='serverList'
            onItemSelected={this._handleServerSelection} />
        )
        if (!isServerDetectionSupported) {
          content.push(
            <DialogContent key='contents'>
              Auto-discovery is not available in this version.
            </DialogContent>
          )
        }
        break

      case 'manual':
        content.push(
          <DialogContent key='contents'>
            <ServerSettingsForm onSubmit={onSubmit}
              onKeyPress={this._handleKeyPress} />
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
      dispatch(closeServerSettingsDialog({
        hostName: data.hostName,
        isSecure: data.isSecure,
        port: Number(data.port)
      }))
    },
    onTabSelected (event, value) {
      dispatch(setServerSettingsDialogTab(value))
    }
  })
)(ServerSettingsDialogPresentation)

export default ServerSettingsDialog
