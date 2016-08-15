import _ from 'lodash'
import React, { PropTypes } from 'react'
import ol from 'openlayers'
import { layer, source } from 'ol-react'
import { connect } from 'react-redux'

import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'

import { setLayerParameterById } from '../../../actions/layers'

import messageHub from '../../../message-hub'
import { coordinateFromLonLat } from '../MapView'

/**
 * Helper function that creates an OpenLayers fill style object from a color.
 *
 * @param {color} color the color of the filling
 * @return {Object} the OpenLayers style object
 */
const makeFillStyle = color => new ol.style.Style({
  fill: new ol.style.Fill({ color: color })
})

// === Settings for this particular layer type ===

class HeatmapLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      minHue: props.layer.parameters.minHue,
      maxHue: props.layer.parameters.maxHue
    }

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
        <p key="header">Heatmap options:</p>
        <TextField ref="devices"
          floatingLabelText="Devices"
          hintText="devices"
          multiLine={true}
          fullWidth={true}
          defaultValue={this.props.layer.parameters.devices.join(',\n')} />
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

  handleChange_ (e) {
    this.setState({
      [e.target.id]: _.toNumber(e.target.value)
    })
  }

  handleClick_ (e) {
    const layerParameters = {
      devices: this.refs.devices.getValue().split(',\n'),
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

class HeatmapVectorSource extends source.Vector {
  constructor (props) {
    super(props)

    this.trySubscribe_ = this.trySubscribe_.bind(this)
    this.processNotification_ = this.processNotification_.bind(this)
    this.makeCircle_ = this.makeCircle_.bind(this)
    this.drawCircleFromData_ = this.drawCircleFromData_.bind(this)

    messageHub.registerNotificationHandler('DEV-INF', this.processNotification_)

    this.trySubscribe_(props.parameters.devices)
  }

  componentWillReceiveProps (newProps) {
    this.source.clear()

    this.trySubscribe_(newProps.parameters.devices)
  }

  trySubscribe_ (devices) {
    if (!messageHub._emitter) {
      setTimeout(() => { this.trySubscribe_(devices) }, 500)
    } else {
      messageHub.sendMessage({
        'type': 'DEV-SUB',
        'paths': devices
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
