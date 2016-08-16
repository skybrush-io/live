import _ from 'lodash'
import React, { PropTypes } from 'react'
import ol from 'openlayers'
import { layer, source } from 'ol-react'
import { connect } from 'react-redux'

import flock from '../../../flock'

import Dialog from 'material-ui/Dialog'
import FlatButton from 'material-ui/FlatButton'

import DropDownMenu from 'material-ui/DropDownMenu'
import MenuItem from 'material-ui/MenuItem'

import RaisedButton from 'material-ui/RaisedButton'

import { List, ListItem } from 'material-ui/List'
import IconButton from 'material-ui/IconButton'
import ContentRemoveCircleOutline from 'material-ui/svg-icons/content/remove-circle-outline'

import TextField from 'material-ui/TextField'

import { setLayerParameterById } from '../../../actions/layers'

import messageHub from '../../../message-hub'
import { coordinateFromLonLat } from '../MapView'

// === Settings for this particular layer type ===

class SubscriptionDialog extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      visible: false,

      subscriptions: props.subscriptions,

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
        <DropDownMenu value={this.state.selectedUAV}
          onChange={_.partial(this.handleChange_, 'selectedUAV')}>
          {UAVMenuItems}
        </DropDownMenu>
        Device:
        <DropDownMenu value={this.state.selectedDevice}
          onChange={_.partial(this.handleChange_, 'selectedDevice')}>
          {DeviceMenuItems}
        </DropDownMenu>
        Channel:
        <DropDownMenu value={this.state.selectedChannel}
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

  updateDeviceList_ () {
    messageHub.sendMessage({
      'type': 'DEV-LIST',
      'ids': Object.keys(flock._uavsById)
    }).then(this.deviceListReceived_)
  }

  deviceListReceived_ (message) {
    const data = message.body.devices
    const available = {}

    for (const uav in data) {
      available[uav] = {}
      for (const device in data[uav].children) {
        available[uav][device] = {}
        for (const channel in data[uav].children[device].children) {
          if (data[uav].children[device].children[channel].operations.includes('read')) {
            available[uav][device][channel] = {}
          }
        }
      }
    }

    this.setState({
      available: available
    })
  }

  handleChange_ (parameter, event, index, value) {
    this.setState({
      [parameter]: value
    })
  }

  get currentPath () {
    return `/${this.state.selectedUAV}/${this.state.selectedDevice}/${this.state.selectedChannel}`
  }

  handleClick_ () {
    const path = this.currentPath

    messageHub.sendMessage({
      'type': 'DEV-SUB',
      'paths': [
        path
      ]
    })

    this.setState({
      subscriptions: this.state.subscriptions.concat(path)
    })
  }

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

    this.setState({
      visible: false
    })
  }
}

SubscriptionDialog.propTypes = {
  subscriptions: PropTypes.arrayOf(PropTypes.string),
  setSubscriptions: PropTypes.func
}

class HeatmapLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      minHue: props.layer.parameters.minHue,
      maxHue: props.layer.parameters.maxHue
    }

    this.showSubscriptionDialog_ = this.showSubscriptionDialog_.bind(this)
    this.handleChange_ = this.handleChange_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)
  }

  render () {
    const makeRangeStyle = hue => ({
      display: 'inline-block',
      width: '50px',
      height: '25px',
      margin: '10px 0px',
      backgroundColor: `hsla(${hue}, 70%, 50%, 0.5)`
    })

    return (
      <div>
        <SubscriptionDialog ref="subscriptionDialog"
          subscriptions={this.props.layer.parameters.subscriptions}
          setSubscriptions={_.partial(this.props.setLayerParameter, 'subscriptions')} />

        <p key="header">Heatmap options:</p>
        <RaisedButton
          label="Edit subscriptions"
          onClick={this.showSubscriptionDialog_} />

        <br />

        {/* <TextField ref="subscriptions"
          floatingLabelText="Devices"
          hintText="subscriptions"
          multiLine={true}
          fullWidth={true}
        defaultValue={this.props.layer.parameters.subscriptions.join(',\n')} /> */}

        <TextField ref="minValue"
          floatingLabelText="The minimum value"
          hintText="minValue"
          type="number"
          defaultValue={this.props.layer.parameters.minValue} />
        <TextField ref="maxValue"
          floatingLabelText="The maximum value"
          hintText="maxValue"
          type="number"
          defaultValue={this.props.layer.parameters.maxValue} />

        <br />

        <input id="minHue" ref="minHue" type="range" min="0" max="360"
          value={this.state.minHue}
          onChange={this.handleChange_}/>
        <div style={makeRangeStyle(this.state.minHue)} />
        <div style={makeRangeStyle(this.state.maxHue)} />
        <input id="maxHue" ref="maxHue" type="range" min="0" max="360"
          value={this.state.maxHue}
          onChange={this.handleChange_}/>

        <br />

        <RaisedButton
          label="Update parameters"
          onClick={this.handleClick_} />
      </div>
    )
  }

  showSubscriptionDialog_ () {
    this.refs.subscriptionDialog.updateDeviceList_()
    this.refs.subscriptionDialog.showDialog()
  }

  handleChange_ (e) {
    this.setState({
      [e.target.id]: _.toNumber(e.target.value)
    })
  }

  handleClick_ (e) {
    const layerParameters = {
      // subscriptions: this.refs.subscriptions.getValue().split(',\n'),
      minValue: _.toNumber(this.refs.minValue.getValue()),
      maxValue: _.toNumber(this.refs.maxValue.getValue()),
      minHue: this.state.minHue,
      maxHue: this.state.maxHue
    }

    for (const layerParameter in layerParameters) {
      this.props.setLayerParameter(layerParameter, layerParameters[layerParameter])
    }
  }
}

HeatmapLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  setLayerParameter: PropTypes.func
}

export const HeatmapLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameter: (parameter, value) => {
      dispatch(setLayerParameterById(ownProps.layerId, parameter, value))
    }
  })
)(HeatmapLayerSettingsPresentation)

// === The actual layer to be rendered ===

/**
 * Helper function that creates an OpenLayers fill style object from a color.
 *
 * @param {color} color the color of the filling
 * @return {Object} the OpenLayers style object
 */
const makeFillStyle = color => new ol.style.Style({
  fill: new ol.style.Fill({ color: color })
})

class HeatmapVectorSource extends source.Vector {
  constructor (props) {
    super(props)

    this.trySubscribe_ = this.trySubscribe_.bind(this)
    this.processNotification_ = this.processNotification_.bind(this)
    this.makeCircle_ = this.makeCircle_.bind(this)
    this.drawCircleFromData_ = this.drawCircleFromData_.bind(this)

    messageHub.registerNotificationHandler('DEV-INF', this.processNotification_)

    this.trySubscribe_(props.parameters.subscriptions)
  }

  componentWillReceiveProps (newProps) {
    this.source.clear()

    this.trySubscribe_(newProps.parameters.subscriptions)
  }

  trySubscribe_ (subscriptions) {
    if (!messageHub._emitter) {
      setTimeout(() => { this.trySubscribe_(subscriptions) }, 500)
    } else {
      messageHub.sendMessage({
        'type': 'DEV-SUB',
        'paths': subscriptions
      })
    }
  }

  processNotification_ (message) {
    for (const value in message.body.values) {
      this.drawCircleFromData_(message.body.values[value])
    }
  }

  makeCircle_ (center, radius) {
    return new ol.Feature({
      geometry: new ol.geom.Circle(coordinateFromLonLat(center), radius)
    })
  }

  drawCircleFromData_ (data) {
    const circle = this.makeCircle_([data.lon, data.lat], 3)

    const { minHue, maxHue, minValue, maxValue } = this.props.parameters

    const hue = (data.value - minValue) / (maxValue - minValue) * (maxHue - minHue) + minHue

    circle.setStyle(makeFillStyle(`hsla(${hue}, 70%, 50%, 0.5)`))

    this.source.addFeature(circle)
  }
}

HeatmapVectorSource.propTypes = {
  parameters: PropTypes.object
}

class HeatmapLayerPresentation extends React.Component {
  render () {
    if (!this.props.layer.visible) {
      return false
    }

    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex}>
          <HeatmapVectorSource parameters={this.props.layer.parameters} />
        </layer.Vector>

        <div id="heatmapScale"
          style={{
            background: `linear-gradient(
            hsla(${this.props.layer.parameters.maxHue}, 70%, 50%, 0.75),
            hsla(${this.props.layer.parameters.minHue}, 70%, 50%, 0.75)
            )`
          }}>
          <span>{this.props.layer.parameters.maxValue}</span>
          <span>{(this.props.layer.parameters.maxValue +
          this.props.layer.parameters.minValue) / 2}</span>
          <span>{this.props.layer.parameters.minValue}</span>
        </div>
      </div>
    )
  }
}

HeatmapLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number
}

export const HeatmapLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(HeatmapLayerPresentation)
