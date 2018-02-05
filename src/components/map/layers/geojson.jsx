import Color from 'color'
import _ from 'lodash'
import GeoJSON from 'ol/format/geojson'
import Point from 'ol/geom/point'
import { layer, source } from 'ol-react'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import TextField from 'material-ui/TextField'

import PopupColorPicker from '../../PopupColorPicker'

import Button from 'material-ui/Button'

import { setLayerParameterById } from '../../../actions/layers'
import { showSnackbarMessage } from '../../../actions/snackbar'

import { parseColor } from '../../../utils/coloring'
import { convertSimpleStyleToOLStyle } from '../../../utils/simplestyle'

// === Settings for this particular layer type ===

class GeoJSONLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      data: JSON.stringify(props.layer.parameters.data, null, 2)
    }

    this._handleChange = this._handleChange.bind(this)
    this._handleClick = this._handleClick.bind(this)
  }

  render () {
    return (
      <div>
        <span>Stroke color: </span>
        <PopupColorPicker ref='strokeColor'
          defaultValue={this.props.layer.parameters.strokeColor} />
        <span style={{ marginLeft: '25px' }}>Fill color: </span>
        <PopupColorPicker ref='fillColor'
          defaultValue={this.props.layer.parameters.fillColor} />

        <TextField ref='strokeWidth'
          floatingLabelText='Stroke width:'
          hintText='stroke width'
          type='number'
          defaultValue={this.props.layer.parameters.strokeWidth} />

        <TextField ref='dataTextField'
          floatingLabelText='Paste GeoJSON data here:'
          hintText='GeoJSON'
          multiLine
          rowsMax={10}
          textareaStyle={{height: '85%'}}
          fullWidth
          value={this.state.data}
          onChange={this._handleChange} />

        <div style={{ textAlign: 'center', paddingTop: '1em' }}>
          <Button onClick={this._handleClick}>Import GeoJSON</Button>
        </div>
      </div>
    )
  }

  _handleChange (e) {
    this.setState({
      data: e.target.value
    })
  }

  _handleClick () {
    this.props.setLayerParameter('strokeColor', this.refs.strokeColor.getValue())
    this.props.setLayerParameter('fillColor', this.refs.fillColor.getValue())
    this.props.setLayerParameter('strokeWidth', _.toNumber(this.refs.strokeWidth.getValue()))

    try {
      const parsedData = JSON.parse(this.state.data)
      this.props.setLayerParameter('data', parsedData)
      this.props.showMessage('GeoJSON imported successfully.')
    } catch (e) {
      this.props.showMessage('Invalid GeoJSON data.')
    }
  }
}

GeoJSONLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  setLayerParameter: PropTypes.func,
  showMessage: PropTypes.func
}

export const GeoJSONLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameter: (parameter, value) => {
      dispatch(setLayerParameterById(ownProps.layerId, parameter, value))
    },
    showMessage: (message) => {
      dispatch(showSnackbarMessage(message))
    }
  })
)(GeoJSONLayerSettingsPresentation)

// === The actual layer to be rendered ===

class GeoJSONVectorSource extends source.Vector {
  constructor (props) {
    super(props)

    this.geojsonFormat = new GeoJSON()
    this._updateFeaturesFromProps(props)
  }

  componentWillReceiveProps (newProps) {
    this._updateFeaturesFromProps(newProps)
  }

  _parseFeatures (data) {
    try {
      return this.geojsonFormat.readFeatures(data, {
        featureProjection: 'EPSG:3857'
      })
    } catch (e) {
      console.error('Failed to parse GeoJSON data in layer')
      return []
    }
  }

  _updateFeaturesFromProps (props) {
    const features = this._parseFeatures(props.data)
    this.source.clear()
    this.source.addFeatures(features)
  }
}

class GeoJSONLayerPresentation extends React.Component {
  constructor (props) {
    super(props)

    this._styleDefaults = {}
    this._styleFunction = this._styleFunction.bind(this)
    this._updateStyleFromProps(props)
  }

  render () {
    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex} style={this._styleFunction}>
          <GeoJSONVectorSource data={this.props.layer.parameters.data} />
        </layer.Vector>
      </div>
    )
  }

  componentWillReceiveProps (newProps) {
    this._updateStyleFromProps(newProps)
  }

  _styleFunction (feature) {
    // Okay, this is a bit of a hack but I think it won't hurt. We make use of
    // the fact that the style function of the layer is called only for features
    // that do not have a style on their own. Therefore, we calculate the style
    // for the feature (which will not change) and then set it explicitly so the
    // style function won't be called again.
    const props = feature.getProperties()

    // Force point geometries to always have a marker
    if (!props['marker-symbol'] && feature.getGeometry() instanceof Point) {
      props['marker-symbol'] = 'marker'
    }

    const olStyle = convertSimpleStyleToOLStyle(props, this._styleDefaults)
    feature.setStyle(olStyle)
    return olStyle
  }

  _updateStyleFromProps (props) {
    const { parameters } = props.layer
    const { strokeWidth } = parameters
    const strokeColor = parseColor(parameters.strokeColor, '#0088ff')
    const fillColor = parseColor(parameters.fillColor, Color('#0088ff').alpha(0.5))
    this._styleDefaults = {
      'stroke': strokeColor.rgb().hex(),
      'stroke-opacity': strokeColor.alpha(),
      'stroke-width': strokeWidth,
      'fill': fillColor.rgb().hex(),
      'fill-opacity': fillColor.alpha()
    }
  }
}

GeoJSONLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number
}

export const GeoJSONLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(GeoJSONLayerPresentation)
