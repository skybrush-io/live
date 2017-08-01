import _ from 'lodash'
import HashedMap from '../../../utils/hashedmap'

import React, { PropTypes } from 'react'
import ol from 'openlayers'
import { layer, source } from 'ol-react'
import { connect } from 'react-redux'

import SubscriptionDialog from '../../SubscriptionDialog'
import RaisedButton from 'material-ui/RaisedButton'

import TextField from 'material-ui/TextField'
import Checkbox from 'material-ui/Checkbox'

import ContentClear from 'material-ui/svg-icons/content/clear'

import { setLayerParameterById } from '../../../actions/layers'

import messageHub from '../../../message-hub'
import {
  coordinateFromLonLat,
  lonLatFromCoordinate,
  wgs84Sphere
} from '../../../utils/geography'

// === Settings for this particular layer type ===

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
    this.clearData_ = this.clearData_.bind(this)
  }

  render () {
    const textFieldStyle = {
      width: '150px',
      margin: '10px',
      marginTop: '-15px'
    }

    return (
      <div>
        <SubscriptionDialog ref={'subscriptionDialog'}
          subscriptions={this.props.layer.parameters.subscriptions}
          setSubscriptions={_.partial(this.props.setLayerParameter, 'subscriptions')}
          unit={this.props.layer.parameters.unit}
          setUnit={_.partial(this.props.setLayerParameter, 'unit')} />

        <p key={'header'}>Heatmap options:</p>
        <RaisedButton
          label={'Edit subscriptions'}
          onClick={this.showSubscriptionDialog_} />

        <br />

        <TextField ref={'threshold'}
          style={textFieldStyle}
          floatingLabelText={'Threshold'}
          type={'number'}
          defaultValue={this.props.layer.parameters.threshold} />

        <br />

        <TextField ref={'minValue'}
          style={textFieldStyle}
          floatingLabelText={'Minimum value'}
          type={'number'}
          defaultValue={this.props.layer.parameters.minValue} />
        <TextField ref={'maxValue'}
          style={textFieldStyle}
          floatingLabelText={'Maximum value'}
          type={'number'}
          defaultValue={this.props.layer.parameters.maxValue} />

        <Checkbox ref={'autoScale'}
          defaultChecked={this.props.layer.parameters.autoScale}
          style={{display: 'inline-table', width: '150px'}}
          label={'Auto scale'} />

        <br />

        <div style={{
          width: '300px',
          height: '25px',
          marginLeft: '50px',
          background: `linear-gradient(-90deg,
          hsla(${this.state.maxHue}, 70%, 50%, 0.75),
          hsla(${this.state.minHue}, 70%, 50%, 0.75)
          )`
        }} />
        <input id={'minHue'} ref={'minHue'} type={'range'} min={'0'} max={'360'}
          style={{width: '100px'}}
          value={this.state.minHue}
          onChange={this.handleChange_} />
        <input id={'maxHue'} ref={'maxHue'} type={'range'} min={'0'} max={'360'}
          style={{width: '100px', marginLeft: '200px'}}
          value={this.state.maxHue}
          onChange={this.handleChange_} />

        <br />

        <TextField ref={'minDistance'}
          floatingLabelText={'Minimum distance between points (m)'}
          type={'number'}
          defaultValue={this.props.layer.parameters.minDistance} />
        <Checkbox ref={'snapToGrid'}
          defaultChecked={this.props.layer.parameters.snapToGrid}
          style={{display: 'inline-table', width: '150px', marginLeft: '8px'}}
          label={'Snap to grid'} />

        <RaisedButton style={{marginTop: '10px'}}
          label={'Update parameters'}
          onClick={this.handleClick_} />

        <RaisedButton style={{marginLeft: '10px'}}
          backgroundColor={'#ff7777'}
          label={'Clear data'}
          icon={<ContentClear />}
          onClick={this.clearData_} />
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
      threshold: _.toNumber(this.refs.threshold.getValue()),
      minValue: _.toNumber(this.refs.minValue.getValue()),
      maxValue: _.toNumber(this.refs.maxValue.getValue()),
      minHue: this.state.minHue,
      maxHue: this.state.maxHue,
      autoScale: this.refs.autoScale.isChecked(),
      minDistance: _.toNumber(this.refs.minDistance.getValue()),
      snapToGrid: this.refs.snapToGrid.isChecked()
    }

    for (const layerParameter in layerParameters) {
      this.props.setLayerParameter(layerParameter, layerParameters[layerParameter])
    }
  }

  clearData_ () {
    window.localStorage.removeItem(`${this.props.layerId}_data`)
    this.props.setLayerParameter('minValue', 0)
    this.props.setLayerParameter('maxValue', 0)
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
 * Helper function that calculates the distance of two data packets.
 *
 * @param {devicedata} a the first packet to compare
 * @param {devicedata} b the second packet to compare
 * @return {number} the distance between the packets
 */
const getDistance = (a, b) => wgs84Sphere.haversineDistance(
  [a.lon, a.lat], [b.lon, b.lat]
)

/**
 * Helper function that creates an OpenLayers fill style object from a color.
 *
 * @param {color} color the color of the filling
 * @param {number} radius the radius to fill
 * @return {Object} the OpenLayers style object
 */
const makePointStyle = (color, radius) => new ol.style.Style({
  image: new ol.style.Circle({
    fill: new ol.style.Fill({ color }), radius
  })
})

class HeatmapVectorSource extends source.Vector {
  constructor (props) {
    super(props)

    this.getStoredData_ = this.getStoredData_.bind(this)
    this.setStoredData_ = this.setStoredData_.bind(this)
    this.drawFromStoredData_ = this.drawFromStoredData_.bind(this)

    this.trySubscribe_ = this.trySubscribe_.bind(this)
    this.processNotification_ = this.processNotification_.bind(this)

    this.makePoint_ = this.makePoint_.bind(this)
    this.drawPointFromData_ = this.drawPointFromData_.bind(this)

    this.features = new HashedMap()
    this.drawFromStoredData_()

    messageHub.registerNotificationHandler('DEV-INF', this.processNotification_)

    this.trySubscribe_(props.parameters.subscriptions)
  }

  componentDidUpdate () {
    this.drawFromStoredData_()
  }

  componentWillUnmount () {
    messageHub.unregisterNotificationHandler('DEV-INF', this.processNotification_)
  }

  getStoredData_ () {
    if (!window.localStorage.getItem(this.props.storageKey)) {
      window.localStorage.setItem(this.props.storageKey, '[]')
    }

    return new HashedMap(JSON.parse(window.localStorage.getItem(this.props.storageKey)))
  }

  setStoredData_ (values) {
    window.localStorage.setItem(this.props.storageKey, JSON.stringify([...values.map_]))
  }

  drawFromStoredData_ () {
    this.source.clear()
    this.features = new HashedMap()

    const values = this.getStoredData_()

    for (const [key, value] of values) {
      this.features.set(key, this.drawPointFromData_(Object.assign({value}, key)))
    }
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

  processData_ (values, data) {
    const minDistance = this.props.parameters.minDistance

    if (this.props.parameters.snapToGrid) {
      const mercator = coordinateFromLonLat([data.lon, data.lat])
      const snappedMercator = [
        Math.round(mercator[0] / minDistance) * minDistance,
        Math.round(mercator[1] / minDistance) * minDistance
      ]
      const snappedLonLat = lonLatFromCoordinate(snappedMercator)
      data.lon = snappedLonLat[0]
      data.lat = snappedLonLat[1]

      const snappedKey = {lon: data.lon, lat: data.lat}

      if (values.has(snappedKey)) {
        data.value = (values.get(snappedKey) + data.value) / 2
        values.set(snappedKey, data.value)
        this.features.get(snappedKey).measuredValue = data.value

        return
      }
    } else {
      for (const key of values.keys()) {
        if (getDistance(key, data) < minDistance) {
          data.value = (values.get(key) + data.value) / 2
          values.set(key, data.value)
          this.features.get(key).measuredValue = data.value

          return
        }
      }
    }

    const key = {lon: data.lon, lat: data.lat}
    values.set(key, data.value)
    this.features.set(key, this.drawPointFromData_(data))
  }

  processNotification_ (message) {
    const values = this.getStoredData_()

    for (const path in message.body.values) {
      // Check if we are subscribed to this channel
      if (this.props.parameters.subscriptions.includes(path)) {
        // Check if the message actually has a valid value
        if (message.body.values[path].value !== null) {
          const data = message.body.values[path]

          this.processData_(values, data)

          if (this.props.parameters.autoScale) {
            if (data.value > this.props.parameters.threshold && (
              data.value < this.props.parameters.minValue || (
              this.props.parameters.minValue === 0 &&
              this.props.parameters.maxValue === 0
            ))) {
              this.props.setLayerParameter('minValue', data.value)
            }

            if (data.value > this.props.parameters.maxValue) {
              this.props.setLayerParameter('maxValue', data.value)
            }
          }
        }
      }
    }

    this.setStoredData_(values)

    if (this.features.size !== values.size) {
      this.drawFromStoredData_()
    }
  }

  makePoint_ (center) {
    return new ol.Feature({
      geometry: new ol.geom.Point(coordinateFromLonLat(center))
    })
  }

  drawPointFromData_ (data) {
    const point = this.makePoint_([data.lon, data.lat])
    point.measuredValue = data.value

    this.source.addFeature(point)

    return point
  }
}

HeatmapVectorSource.propTypes = {
  storageKey: PropTypes.string,
  parameters: PropTypes.object,

  setLayerParameter: PropTypes.func
}

class HeatmapLayerPresentation extends React.Component {
  constructor (props) {
    super(props)

    this._colorForValue = this._colorForValue.bind(this)
    this.styleFunction = this.styleFunction.bind(this)
  }

  _colorForValue (value) {
    const { minHue, maxHue, threshold, minValue, maxValue } = this.props.layer.parameters

    if (value < threshold) {
      return 'hsla(0, 100%, 100%, 0.5)'
    }

    const hue = (value - minValue) / (maxValue - minValue) * (maxHue - minHue) + minHue

    return `hsla(${hue}, 70%, 50%, 0.5)`
  }

  styleFunction (feature, resolution) {
    // const zoom = Math.round(17 - Math.log2(resolution))

    const radius = 0.9 / resolution + 1.5

    return makePointStyle(this._colorForValue(feature.measuredValue), radius)
  }

  render () {
    if (!this.props.layer.visible) {
      return false
    }

    const { minValue, maxValue, unit } = this.props.layer.parameters

    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex} style={this.styleFunction}>
          <HeatmapVectorSource storageKey={`${this.props.layerId}_data`}
            parameters={this.props.layer.parameters}
            setLayerParameter={this.props.setLayerParameter} />
        </layer.Vector>

        <div id={'heatmapScale'}
          style={{
            background: `linear-gradient(
            hsla(${this.props.layer.parameters.maxHue}, 70%, 50%, 0.75),
            hsla(${this.props.layer.parameters.minHue}, 70%, 50%, 0.75)
            )`
          }}>
          <span>{`${(maxValue).toFixed(3)} ${unit}`}</span>
          <span>{`${((maxValue + minValue) / 2).toFixed(3)} ${unit}`}</span>
          <span>{`${(minValue).toFixed(3)} ${unit}`}</span>
        </div>
      </div>
    )
  }
}

HeatmapLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number,

  setLayerParameter: PropTypes.func
}

export const HeatmapLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameter: (parameter, value) => {
      dispatch(setLayerParameterById(ownProps.layerId, parameter, value))
    }
  })
)(HeatmapLayerPresentation)
