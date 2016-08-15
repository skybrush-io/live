import _ from 'lodash'
import React, { PropTypes } from 'react'
import ol from 'openlayers'
import { layer, source } from 'ol-react'
import { connect } from 'react-redux'

import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'

import { setLayerParameterById } from '../../../actions/layers'

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

class HexGridLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.handleClick_ = this.handleClick_.bind(this)
  }

  render () {
    return (
      <div>
        <p key="header">Draw Hex Grid:</p>
        <TextField ref="center"
          floatingLabelText="Center of the grid"
          hintText="Center (comma separated)"
          defaultValue={this.props.layer.parameters.center} />
        <TextField ref="size"
          floatingLabelText="Size of the grid"
          hintText="Size"
          defaultValue={this.props.layer.parameters.size} />
        <TextField ref="radius"
          floatingLabelText="Radius of one cell"
          hintText="Radius"
          defaultValue={this.props.layer.parameters.radius} />
        <br />
        <RaisedButton
          label="Draw hex grid"
          onClick={this.handleClick_} />
      </div>
    )
  }

  handleClick_ (e) {
    const layerParameters = {
      center: this.refs.center.getValue().split(',').map(_.toNumber),
      size: _.toNumber(this.refs.size.getValue()),
      radius: _.toNumber(this.refs.radius.getValue())
    }

    for (const layerParameter in layerParameters) {
      this.props.setLayerParameter(layerParameter, layerParameters[layerParameter])
    }
  }
}

HexGridLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  setLayerParameter: PropTypes.func
}

export const HexGridLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameter: (parameter, value) => {
      dispatch(setLayerParameterById(ownProps.layerId, parameter, value))
    }
  })
)(HexGridLayerSettingsPresentation)

// === The actual layer to be rendered ===

class HexGridVectorSource extends source.Vector {
  constructor (props) {
    super(props)

    this.drawHexagensFromProps_(props)
  }

  componentWillReceiveProps (newProps) {
    this.source.clear()

    this.drawHexagensFromProps_(newProps)
  }

  getCorners_ (center, radius) {
    const angles = [30, 90, 150, 210, 270, 330].map(a => a * Math.PI / 180)

    return angles.map(angle => coordinateFromLonLat([
      center[0] + radius * Math.sin(angle),
      center[1] + radius * Math.cos(angle)
    ]))
  }

  getHexagon_ (center, radius) {
    return new ol.Feature(
      {
        geometry: new ol.geom.Polygon([
          this.getCorners_(center, radius)
        ])
      }
    )
  }

  drawHexagensFromProps_ (props) {
    const { center, size, radius } = props.parameters

    const features = {}

    for (let x = -size; x <= size; x++) {
      for (let z = Math.max(-size, -size - x); z <= Math.min(size, size - x); z++) {
        const hash = `${x},${z}`
        features[hash] = this.getHexagon_([
          center[0] + (radius * 1.5 * x),
          center[1] - (radius * Math.sqrt(3)) * (0.5 * x + z)
        ], radius)
        features[hash].setId(hash)
      }
    }

    this.source.addFeatures(_.values(features))

    for (const hash in features) {
      const coordinates = hash.split(',').map(_.toNumber)
      const hue = (_.sum(coordinates.map(Math.abs)) / (size * 2 + 1)) * 115
      features[hash].setStyle(makeFillStyle(`hsla(${hue}, 70%, 50%, 0.5)`))
    }
  }
}

HexGridVectorSource.propTypes = {
  parameters: PropTypes.object
}

class HexGridLayerPresentation extends React.Component {
  render () {
    if (!this.props.layer.visible) {
      return false
    }

    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex}>
          <HexGridVectorSource parameters={this.props.layer.parameters} />
        </layer.Vector>

        <div id="heatmapScale">
          <span>100%</span>
          <span>50%</span>
          <span>0%</span>
        </div>
      </div>
    )
  }
}

HexGridLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number
}

export const HexGridLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(HexGridLayerPresentation)
