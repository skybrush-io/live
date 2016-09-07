import _ from 'lodash'
import React, { PropTypes } from 'react'

import flock from '../flock'

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'

import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'
import RaisedButton from 'material-ui/RaisedButton'

import { List, ListItem } from 'material-ui/List'
import IconButton from 'material-ui/IconButton'
import ContentRemoveCircleOutline from 'material-ui/svg-icons/content/remove-circle-outline'

import messageHub from '../message-hub'

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

    this.updateDeviceList_ = this.updateDeviceList_.bind(this)
    this.deviceListReceived_ = this.deviceListReceived_.bind(this)

    this.handleChange_ = this.handleChange_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)

    this.removeSubscription_ = this.removeSubscription_.bind(this)

    this.showDialog = this.showDialog.bind(this)
    this.hideDialog_ = this.hideDialog_.bind(this)
  }

  render () {
    const UAVMenuItems = Object.keys(this.state.available).map(uav =>
      <MenuItem key={uav} value={uav} primaryText={uav} />
    )

    const DeviceMenuItems = this.state.selectedUAV
    ? Object.keys(this.state.available[this.state.selectedUAV]).map(device =>
      <MenuItem key={device} value={device} primaryText={device} />
    ) : []

    const ChannelMenuItems = this.state.selectedDevice
    ? Object.keys(
      this.state.available[this.state.selectedUAV][this.state.selectedDevice]
    ).map(channel =>
      <MenuItem key={channel} value={channel} primaryText={channel} />
    ) : []

    const subscriptionItems = this.state.subscriptions.map(subscription =>
      <ListItem key={subscription} primaryText={subscription} rightIconButton={
        <IconButton tooltip="Unsubscribe"
          onClick={_.partial(this.removeSubscription_, subscription)}>
          <ContentRemoveCircleOutline />
        </IconButton>
      } />
    )

    const actions = [
      <FlatButton label="Done" primary={true} onTouchTap={this.hideDialog_} />
    ]

    return (
      <Dialog
        open={this.state.visible}
        actions={actions}>
        UAV:
        <DropDownMenu ref="uavDropDown" value={this.state.selectedUAV}
          onChange={_.partial(this.handleChange_, 'selectedUAV')}>
          {UAVMenuItems}
        </DropDownMenu>
        Device:
        <DropDownMenu ref="deviceDropDown" value={this.state.selectedDevice}
          onChange={_.partial(this.handleChange_, 'selectedDevice')}>
          {DeviceMenuItems}
        </DropDownMenu>
        Channel:
        <DropDownMenu ref="channelDropDown" value={this.state.selectedChannel}
          onChange={_.partial(this.handleChange_, 'selectedChannel')}>
          {ChannelMenuItems}
        </DropDownMenu>
        <RaisedButton
          disabled={this.state.subscriptions.includes(this.currentPath)}
          label="Subscribe"
          onClick={this.handleClick_} />

        <List>
          {subscriptionItems}
        </List>
      </Dialog>
    )
  }

  /**
   * Function for requesting the available UAVs, devices and channels.
   */
  updateDeviceList_ () {
    messageHub.sendMessage({
      'type': 'DEV-LIST',
      'ids': Object.keys(flock._uavsById)
    }).then(this.deviceListReceived_)
  }

  /**
   * Function for processing and storing the received list of
   * available UAVs, devices and channels.
   *
   * @param {Object} message the response from the server
   * containing the requested data
   */
  deviceListReceived_ (message) {
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
   * Function to handle the DropDownMenu value changes.
   *
   * @param {string} parameter the state parameter to be updated
   * @param {string} event the actual change event
   * @param {string} index the index of the selected item
   * @param {string} value the value of the selected item
   */
  handleChange_ (parameter, event, index, value) {
    this.setState({
      [parameter]: value
    })

    const nextField = {
      selectedUAV: this.refs.deviceDropDown,
      selectedDevice: this.refs.channelDropDown
    }

    if (parameter in nextField) {
      setTimeout(() => { this.openDropDown(nextField[parameter]) }, 100)
    }
  }

  /**
   * Function to open a DropDownMenu element.
   *
   * @param {DropDownMenu} dropDown the element to be opened
   */
  openDropDown (dropDown) {
    dropDown.setState({ open: true, anchorEl: dropDown.getInputNode() })
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
  handleClick_ () {
    if (this.state.selectedUAV === 'All') {
      const paths = []

      for (const uav in _.omit(this.state.available, 'All')) {
        if (
          this.state.selectedDevice in this.state.available[uav] &&
          this.state.selectedChannel in this.state.available[uav][this.state.selectedDevice]
        ) {
          paths.push(`/${uav}/${this.state.selectedDevice}/${this.state.selectedChannel}`)
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
        unit: this.state.available[this.state.selectedUAV][this.state.selectedDevice][this.state.selectedChannel].unit
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
        unit: this.state.available[this.state.selectedUAV][this.state.selectedDevice][this.state.selectedChannel].unit
      })
    }
  }

  /**
   * Function to handle unsubscription.
   *
   * @param {string} subscription the path of the subscription to cancel
   */
  removeSubscription_ (subscription) {
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

  showDialog () {
    this.setState({
      visible: true
    })
  }

  hideDialog_ () {
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
