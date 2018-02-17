import { partial, toNumber } from 'lodash'
import numbro from 'numbro'
import Feature from 'ol/feature'
import Point from 'ol/geom/point'
import Circle from 'ol/style/circle'
import Fill from 'ol/style/fill'
import Style from 'ol/style/style'
import { layer, source } from 'ol-react'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Button from 'material-ui/Button'
import { FormControlLabel, FormGroup } from 'material-ui/Form'
import { InputAdornment } from 'material-ui/Input'
import Switch from 'material-ui/Switch'
import TextField from 'material-ui/TextField'

import { setLayerParameterById } from '../../../actions/layers'
import SubscriptionDialog from '../../../components/dialogs/SubscriptionDialog'
import messageHub from '../../../message-hub'
import HashedMap from '../../../utils/hashedmap'
import {
  coordinateFromLonLat,
  lonLatFromCoordinate,
  wgs84Sphere
} from '../../../utils/geography'

const formatNumber = x => numbro(x).format('0.000')

// === Settings for this particular layer type ===

class HeatmapLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      minHue: props.layer.parameters.minHue,
      maxHue: props.layer.parameters.maxHue
    }

    this._showSubscriptionDialog = this._showSubscriptionDialog.bind(this)
    this._handleChange = this._handleChange.bind(this)
    this._handleClick = this._handleClick.bind(this)
    this._clearData = this._clearData.bind(this)

    this._refs = {}
    this._assignRefs = {}

    this._setAutoscale = (event, checked) => {
      this.props.setLayerParameter('autoScale', checked)
    }
    this._setSnapToGrid = (event, checked) => {
      this.props.setLayerParameter('snapToGrid', checked)
    }

    const assignRef = (key, value) => { this._refs[key] = value }
    ['threshold', 'minValue', 'maxValue', 'minDistance', 'subscriptionDialog'].forEach(key => {
      this._refs[key] = null
      this._assignRefs[key] = partial(assignRef, key)
    })
  }

  render () {
    const { setLayerParameter } = this.props
    const { parameters } = this.props.layer
    const { minHue, maxHue } = this.state

    const textFieldStyle = {
      marginRight: 10,
      width: 150
    }

    return (
      <div>
        <SubscriptionDialog ref={this._assignRefs.subscriptionDialog}
          subscriptions={parameters.subscriptions}
          setSubscriptions={partial(setLayerParameter, 'subscriptions')}
          unit={parameters.unit}
          setUnit={partial(setLayerParameter, 'unit')} />

        <Button raised style={{marginBottom: '10px'}}
          onClick={this._showSubscriptionDialog}>
          Edit subscriptions
        </Button>

        <br />

        <FormGroup row>
          <TextField inputRef={this._assignRefs.threshold}
            style={textFieldStyle}
            label='Threshold'
            type='number'
            defaultValue={formatNumber(parameters.threshold)} />
        </FormGroup>

        <FormGroup row>
          <TextField inputRef={this._assignRefs.minValue}
            style={textFieldStyle}
            label='Minimum value'
            type='number'
            defaultValue={formatNumber(parameters.minValue)} />
          <TextField inputRef={this._assignRefs.maxValue}
            style={textFieldStyle}
            label='Maximum value'
            type='number'
            defaultValue={formatNumber(parameters.maxValue)} />
          <FormControlLabel label='Autoscale' control={
            <Switch checked={parameters.autoScale} onChange={this._setAutoScale} />
          } />
        </FormGroup>

        <div style={{ padding: '24px 0' }}>
          <div style={{
            width: '300px',
            height: '25px',
            marginLeft: '50px',
            background: `linear-gradient(-90deg,
              hsla(${maxHue}, 70%, 50%, 0.75),
              hsla(${minHue}, 70%, 50%, 0.75)
            )`
          }} />
          <input id='minHue' ref={this._assignRefs.minHue} type='range' min='0' max='360'
            style={{width: '100px'}}
            value={minHue}
            onChange={this._handleChange} />
          <input id='maxHue' ref={this._assignRefs.maxHue} type='range' min='0' max='360'
            style={{width: '100px', marginLeft: '200px'}}
            value={maxHue}
            onChange={this._handleChange} />
        </div>

        <FormGroup row>
          <TextField inputRef={this._assignRefs.minDistance}
            label='Min distance'
            style={textFieldStyle}
            InputProps={{
              endAdornment: <InputAdornment position="end">m</InputAdornment>
            }}
            type='number'
            defaultValue={formatNumber(parameters.minDistance)} />
          <FormControlLabel label='Snap to grid' control={
            <Switch checked={parameters.snapToGrid} onChange={this._setSnapToGrid} />
          } />
        </FormGroup>

        <FormGroup row style={{ paddingTop: 10 }}>
          <Button onClick={this._handleClick}>
            Update parameters
          </Button>

          <Button color='secondary' onClick={this._clearData}>
            Clear data
          </Button>
        </FormGroup>

      </div>
    )
  }

  _showSubscriptionDialog () {
    this._refs.subscriptionDialog._updateDeviceList()
    this._refs.subscriptionDialog.showDialog()
  }

  _handleChange (e) {
    this.setState({
      [e.target.id]: toNumber(e.target.value)
    })
  }

  _handleClick (e) {
    const layerParameters = {
      threshold: toNumber(this._refs.threshold.value),
      minValue: toNumber(this._refs.minValue.value),
      maxValue: toNumber(this._refs.maxValue.value),
      minHue: this.state.minHue,
      maxHue: this.state.maxHue,
      minDistance: toNumber(this._refs.minDistance.value)
    }

    for (const layerParameter in layerParameters) {
      this.props.setLayerParameter(layerParameter, layerParameters[layerParameter])
    }
  }

  _clearData () {
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
const makePointStyle = (color, radius) => new Style({
  image: new Circle({
    fill: new Fill({ color }), radius
  })
})

class HeatmapVectorSource extends source.Vector {
  constructor (props) {
    super(props)

    this._getStoredData = this._getStoredData.bind(this)
    this._setStoredData = this._setStoredData.bind(this)
    this._drawFromStoredData = this._drawFromStoredData.bind(this)

    this._trySubscribe = this._trySubscribe.bind(this)
    this._processNotification = this._processNotification.bind(this)

    this._makePoint = this._makePoint.bind(this)
    this._drawPointFromData = this._drawPointFromData.bind(this)

    this.features = new HashedMap()
    this._drawFromStoredData()

    messageHub.registerNotificationHandler('DEV-INF', this._processNotification)

    this._trySubscribe(props.parameters.subscriptions)
  }

  componentDidUpdate () {
    this._drawFromStoredData()
  }

  componentWillUnmount () {
    messageHub.unregisterNotificationHandler('DEV-INF', this._processNotification)
  }

  _getStoredData () {
    if (!window.localStorage.getItem(this.props.storageKey)) {
      window.localStorage.setItem(this.props.storageKey, '[]')
    }

    return new HashedMap(JSON.parse(window.localStorage.getItem(this.props.storageKey)))
  }

  _setStoredData (values) {
    window.localStorage.setItem(this.props.storageKey, JSON.stringify([...values.data]))
  }

  _drawFromStoredData () {
    this.source.clear()
    this.features = new HashedMap()

    const values = this._getStoredData()

    for (const [key, value] of values) {
      this.features.set(key, this._drawPointFromData(Object.assign({value}, key)))
    }
  }

  _trySubscribe (subscriptions) {
    if (!messageHub._emitter) {
      setTimeout(() => { this._trySubscribe(subscriptions) }, 500)
    } else {
      messageHub.sendMessage({
        'type': 'DEV-SUB',
        'paths': subscriptions
      })
    }
  }

  _processData (values, data) {
    const minDistance = this.props.parameters.minDistance

    /* Converting to the EPSG:3857 projection, snapping it to the grid
    and then converting it back. */
    if (this.props.parameters.snapToGrid) {
      const snappedLonLat = lonLatFromCoordinate(
        coordinateFromLonLat([data.lon, data.lat]).map(
          c => Math.round(c / minDistance) * minDistance
        )
      )

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
    this.features.set(key, this._drawPointFromData(data))
  }

  _processNotification (message) {
    const values = this._getStoredData()

    for (const path in message.body.values) {
      // Check if we are subscribed to this channel
      if (this.props.parameters.subscriptions.includes(path)) {
        // Check if the message actually has a valid value
        if (message.body.values[path].value !== null) {
          const data = message.body.values[path]

          this._processData(values, data)

          if (this.props.parameters.autoScale) {
            if (data.value > this.props.parameters.threshold && (
              data.value < this.props.parameters.minValue || (
                this.props.parameters.minValue === 0 &&
                this.props.parameters.maxValue === 0
              )
            )) {
              this.props.setLayerParameter('minValue', data.value)
            }

            if (data.value > this.props.parameters.maxValue) {
              this.props.setLayerParameter('maxValue', data.value)
            }
          }
        }
      }
    }

    this._setStoredData(values)

    if (this.features.size !== values.size) {
      this._drawFromStoredData()
    }
  }

  _makePoint (center) {
    return new Feature({
      geometry: new Point(coordinateFromLonLat(center))
    })
  }

  _drawPointFromData (data) {
    const point = this._makePoint([data.lon, data.lat])
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
    const { minValue, maxValue, unit } = this.props.layer.parameters

    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex} style={this.styleFunction}>
          <HeatmapVectorSource storageKey={`${this.props.layerId}_data`}
            parameters={this.props.layer.parameters}
            setLayerParameter={this.props.setLayerParameter} />
        </layer.Vector>

        <div id='heatmapScale'
          style={{
            background: `linear-gradient(
              hsla(${this.props.layer.parameters.maxHue}, 70%, 50%, 0.75),
              hsla(${this.props.layer.parameters.minHue}, 70%, 50%, 0.75)
            )`
          }}>
          <span>{`${formatNumber(maxValue)} ${unit}`}</span>
          <span>{`${formatNumber((maxValue + minValue) / 2)} ${unit}`}</span>
          <span>{`${formatNumber(minValue)} ${unit}`}</span>
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
