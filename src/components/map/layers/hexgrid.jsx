import { autobind } from 'core-decorators'
import { sum, toNumber, values } from 'lodash'
import Feature from 'ol/feature'
import Polygon from 'ol/geom/polygon'
import OLMath from 'ol/math'
import Fill from 'ol/style/fill'
import Style from 'ol/style/style'
import { layer, source } from 'ol-react'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import Button from 'material-ui/Button'
import TextField from 'material-ui/TextField'

import { setLayerParameterById } from '../../../actions/layers'

import { coordinateFromLonLat } from '../../../utils/geography'

/**
 * Helper function that creates an OpenLayers fill style object from a color.
 *
 * @param {color} color the color of the filling
 * @return {Object} the OpenLayers style object
 */
const makeFillStyle = color => new Style({
  fill: new Fill({ color: color })
})

// === Settings for this particular layer type ===

class HexGridLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)
    this._inputFields = {}
  }

  render () {
    const { center, size, radius } = this.props.layer.parameters
    const centerAsString = center ? center.join(', ') : ''

    return (
      <div>
        <TextField style={{ paddingRight: '1em' }}
          inputRef={this._assignCenterField}
          label='Center of the grid'
          placeholder='Center (comma separated)'
          defaultValue={centerAsString} />
        <TextField style={{ paddingRight: '1em' }}
          inputRef={this._assignSizeField}
          label='Size of the grid'
          placeholder='Size'
          defaultValue={String(size)} />
        <TextField style={{ paddingRight: '1em' }}
          inputRef={this._assignRadiusField}
          label='Radius of one cell'
          placeholder='Radius'
          defaultValue={String(radius)} />
        <br />&nbsp;<br />
        <Button onClick={this._handleClick}>
          Update hex grid
        </Button>
      </div>
    )
  }

  @autobind
  _assignCenterField (value) {
    this._inputFields['center'] = value
  }

  @autobind
  _assignRadiusField (value) {
    this._inputFields['radius'] = value
  }

  @autobind
  _assignSizeField (value) {
    this._inputFields['size'] = value
  }

  @autobind
  _handleClick () {
    const layerParameters = {
      center: this._inputFields['center'].value.split(',').map(toNumber),
      size: toNumber(this._inputFields['size'].value),
      radius: toNumber(this._inputFields['radius'].value)
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

    this._drawHexagonsFromProps(props)
  }

  componentWillReceiveProps (newProps) {
    this.source.clear()

    this._drawHexagonsFromProps(newProps)
  }

  _getCorners (center, radius) {
    const angles = [30, 90, 150, 210, 270, 330, 30].map(OLMath.toRadians)
    return angles.map(angle => coordinateFromLonLat([
      center[0] + radius * Math.sin(angle),
      center[1] + radius * Math.cos(angle)
    ]))
  }

  _getHexagon (center, radius) {
    return new Feature(
      {
        geometry: new Polygon([
          this._getCorners(center, radius)
        ])
      }
    )
  }

  _drawHexagonsFromProps (props) {
    const { center, size, radius } = props.parameters

    const features = {}

    for (let x = -size; x <= size; x++) {
      for (let z = Math.max(-size, -size - x); z <= Math.min(size, size - x); z++) {
        const hash = `${x},${z}`
        features[hash] = this._getHexagon([
          center[0] + (radius * 1.5 * x),
          center[1] - (radius * Math.sqrt(3)) * (0.5 * x + z)
        ], radius)
        features[hash].setId(hash)
      }
    }

    this.source.addFeatures(values(features))

    for (const hash in features) {
      const coordinates = hash.split(',').map(toNumber)
      const hue = sum(coordinates.map(Math.abs)) / (size * 2 + 1) * 115
      features[hash].setStyle(makeFillStyle(`hsla(${hue}, 70%, 50%, 0.5)`))
    }
  }
}

HexGridVectorSource.propTypes = {
  parameters: PropTypes.object
}

class HexGridLayerPresentation extends React.Component {
  render () {
    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex}>
          <HexGridVectorSource parameters={this.props.layer.parameters} />
        </layer.Vector>

        <div id='heatmapScale'>
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
