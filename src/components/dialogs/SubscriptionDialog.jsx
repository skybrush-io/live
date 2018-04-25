import { autobind } from 'core-decorators'
import _ from 'lodash'
import PropTypes from 'prop-types'
import React from 'react'

import Button from 'material-ui/Button'
import Dialog, { DialogActions, DialogContent } from 'material-ui/Dialog'
import { FormGroup, FormControl } from 'material-ui/Form'
import Input, { InputLabel } from 'material-ui/Input'
import { MenuItem } from 'material-ui/Menu'
import Select from 'material-ui/Select'

import List, { ListItem, ListItemSecondaryAction, ListItemText } from 'material-ui/List'
import IconButton from 'material-ui/IconButton'
import ContentRemoveCircleOutline from 'material-ui-icons/RemoveCircleOutline'

import flock from '../../flock'
import messageHub from '../../message-hub'

/**
 * React Component to chose the subscribed UAV device channels.
 *
 * @param {Object} props properties of the react component
 * @property {string[]} subscriptions the current subsciptions
 * @property {string} unit the current unit of measurement
 * @property {function} setSubscriptions function to set the
 * array of subscriptions
 * @property {function} setUnit function to set the unit of measurement
 */
export default class SubscriptionDialog extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      visible: false,

      subscriptions: props.subscriptions,
      unit: props.unit,

      available: {},

      selectedUAV: null,
      selectedDevice: null,
      selectedChannel: null
    }

    this._refs = {
      deviceDropDown: null,
      channelDropDown: null
    }

    this._assignDeviceDropDownRef = value => { this._refs.deviceDropDown = value }
    this._assignChannelDropDownRef = value => { this._refs.channelDropDown = value }

    this._removeSubscription = this._removeSubscription.bind(this)
  }

  render () {
    const { available, selectedChannel, selectedDevice, selectedUAV,
      subscriptions, visible } = this.state

    const uavMenuItems = Object.keys(available).sort().map(uav =>
      <MenuItem key={uav} value={uav}>{uav}</MenuItem>
    )

    if (uavMenuItems.length === 0) {
      uavMenuItems.push(
        <MenuItem key='__empty__' value=''><em>No UAV</em></MenuItem>
      )
    }

    const deviceMenuItems = selectedUAV
      ? Object.keys(available[selectedUAV]).sort().map(device =>
        <MenuItem key={device} value={device}>{device}</MenuItem>
      )
      : []

    const channelMenuItems = selectedDevice
      ? Object.keys(available[selectedUAV][selectedDevice]).sort().map(channel =>
        <MenuItem key={channel} value={channel}>{channel}</MenuItem>
      )
      : []

    const subscriptionItems = [...subscriptions].sort().map(subscription =>
      <ListItem key={subscription}>
        <ListItemText primary={subscription} />
        <ListItemSecondaryAction>
          <IconButton aria-label='Unsubscribe'
            onClick={_.partial(this._removeSubscription, subscription)}>
            <ContentRemoveCircleOutline />
          </IconButton>
        </ListItemSecondaryAction>
      </ListItem>
    )

    const actions = [
      <Button key='done' color='primary' onClick={this._hideDialog}>Done</Button>
    ]

    const formControlStyle = {
      minWidth: 120,
      margin: 8,
      verticalAlign: 'text-bottom'
    }

    return (
      <Dialog open={visible} fullWidth maxWidth='sm'>
        <DialogContent>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <FormGroup row>
              <FormControl style={formControlStyle}>
                <InputLabel htmlFor='selectedUAV'>UAV</InputLabel>
                <Select value={selectedUAV || ''} onChange={this._handleChange}
                  input={<Input name='selectedUAV' id='selectedUAV' />}>
                  {uavMenuItems}
                </Select>
              </FormControl>

              <FormControl style={formControlStyle}>
                <InputLabel htmlFor='selectedDevice'>Device</InputLabel>
                <Select inputRef={this._assignDeviceDropDownRef}
                  value={selectedDevice || ''} onChange={this._handleChange}
                  input={<Input name='selectedDevice' id='selectedDevice' />}>
                  {deviceMenuItems}
                </Select>
              </FormControl>

              <FormControl style={formControlStyle}>
                <InputLabel htmlFor='selectedChannel'>Channel</InputLabel>
                <Select autoWidth inputRef={this._assignChannelDropDownRef}
                  value={selectedChannel || ''} onChange={this._handleChange}
                  input={<Input name='selectedChannel' id='selectedChannel' />}>
                  {channelMenuItems}
                </Select>
              </FormControl>
            </FormGroup>

            <Button
              style={{ marginBottom: 6 }}
              disabled={subscriptions.includes(this.currentPath)}
              onClick={this._handleClick}>
              Subscribe
            </Button>
          </div>

          <List>
            {subscriptionItems}
          </List>
        </DialogContent>
        <DialogActions>
          {actions}
        </DialogActions>
      </Dialog>
    )
  }

  /**
   * Function for requesting the available UAVs, devices and channels.
   */
  @autobind
  _updateDeviceList () {
    messageHub.sendMessage({
      'type': 'DEV-LIST',
      'ids': Object.keys(flock._uavsById)
    }).then(this._deviceListReceived)
  }

  /**
   * Function for processing and storing the received list of
   * available UAVs, devices and channels.
   *
   * @param {Object} message the response from the server
   * containing the requested data
   */
  @autobind
  _deviceListReceived (message) {
    const data = message.body.devices
    const available = { 'All': {} }

    for (const uav in data) {
      available[uav] = {}
      for (const device in data[uav].children) {
        if (!(device in available['All'])) {
          available['All'][device] = {}
        }
        available[uav][device] = {}
        for (const channel in data[uav].children[device].children) {
          if (data[uav].children[device].children[channel].operations.includes('read')) {
            if (!(channel in available['All'][device])) {
              available['All'][device][channel] = {
                unit: data[uav].children[device].children[channel].unit
              }
            }
            available[uav][device][channel] = {
              unit: data[uav].children[device].children[channel].unit
            }
          }
        }
      }
    }

    this.setState({
      available: available
    })
  }

  /**
   * Function to handle the drop-down menu value changes.
   *
   * @param {string} event the actual change event
   */
  @autobind
  _handleChange (event) {
    const parameter = event.target.name

    this.setState({
      [parameter]: event.target.value
    })

    // TODO: opening the Select field programmatically is not possible
    // with the new Material UI implementation. Let's not waste too much
    // time on this as we will refactor the entire component sooner or
    // later anyway.
  }

  /**
   * Function for getting the currently selected path as a string.
   *
   * @return {string} the actual device path
   */
  get currentPath () {
    return `/${this.state.selectedUAV}/${this.state.selectedDevice}/${this.state.selectedChannel}`
  }

  /**
   * Function to handle the click of the Subscribe button.
   *
   * (If the selected UAV value is 'All', then subscribes to all the UAVs
   * that have the selected channel available.)
   */
  @autobind
  _handleClick () {
    const { available, selectedChannel, selectedDevice, selectedUAV } = this.state

    if (this.state.selectedUAV === 'All') {
      const paths = []

      for (const uav in _.omit(available, 'All')) {
        if (
          selectedDevice in available[uav] &&
          selectedChannel in available[uav][selectedDevice]
        ) {
          paths.push(`/${uav}/${selectedDevice}/${selectedChannel}`)
        }
      }

      messageHub.sendMessage({
        'type': 'DEV-UNSUB',
        'paths': this.state.subscriptions
      })

      messageHub.sendMessage({
        'type': 'DEV-SUB',
        paths
      })

      this.setState({
        subscriptions: paths,
        unit: available[selectedUAV][selectedDevice][selectedChannel].unit
      })
    } else {
      const path = this.currentPath

      messageHub.sendMessage({
        'type': 'DEV-SUB',
        'paths': [
          path
        ]
      })

      this.setState({
        subscriptions: this.state.subscriptions.concat(path),
        unit: available[selectedUAV][selectedDevice][selectedChannel].unit
      })
    }
  }

  /**
   * Function to handle unsubscription.
   *
   * @param {string} subscription the path of the subscription to cancel
   */
  @autobind
  _removeSubscription (subscription) {
    messageHub.sendMessage({
      'type': 'DEV-UNSUB',
      'paths': [
        subscription
      ]
    })

    this.setState({
      subscriptions: _.without(this.state.subscriptions, subscription)
    })
  }

  @autobind
  showDialog () {
    this.setState({
      visible: true
    })
  }

  @autobind
  _hideDialog () {
    this.props.setSubscriptions(this.state.subscriptions)
    this.props.setUnit(this.state.unit)

    this.setState({
      visible: false
    })
  }
}

SubscriptionDialog.propTypes = {
  subscriptions: PropTypes.arrayOf(PropTypes.string),
  unit: PropTypes.string,
  setSubscriptions: PropTypes.func,
  setUnit: PropTypes.func
}
