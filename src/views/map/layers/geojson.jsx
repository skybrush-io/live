import Color from 'color'
import _ from 'lodash'
import GeoJSON from 'ol/format/geojson'
import Point from 'ol/geom/point'
import { layer, source } from '@collmot/ol-react'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import ArrowDownward from '@material-ui/icons/ArrowDownward'
import TextField from '@material-ui/core/TextField'

import PopupColorPicker from '../../../components/PopupColorPicker'

import Button from '@material-ui/core/Button'

import { setLayerParameterById } from '../../../actions/layers'
import { showSnackbarMessage } from '../../../actions/snackbar'

import { parseColor } from '../../../utils/coloring'
import { convertSimpleStyleToOLStyle } from '../../../utils/simplestyle'
import { primaryColor } from '../../../utils/styles'

// === Settings for this particular layer type ===

class GeoJSONLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      strokeColor: props.layer.parameters.strokeColor,
      fillColor: props.layer.parameters.fillColor,
      strokeWidth: props.layer.parameters.strokeWidth,
      data: JSON.stringify(props.layer.parameters.data, null, 2)
    }

    this._handleStrokeColorChange = this._handleStrokeColorChange.bind(this)
    this._handleFillColorChange = this._handleFillColorChange.bind(this)
    this._handleStrokeWidthChange = this._handleStrokeWidthChange.bind(this)
    this._handleDataChange = this._handleDataChange.bind(this)
    this._handleClick = this._handleClick.bind(this)
  }

  render () {
    return (
      <div>
        <span>Stroke color: </span>
        <PopupColorPicker
          value={this.state.strokeColor}
          onChange={this._handleStrokeColorChange}
        />

        <span style={{ marginLeft: '25px' }}>Fill color: </span>
        <PopupColorPicker
          value={this.state.fillColor}
          onChange={this._handleFillColorChange}
        />

        <TextField
          style={{ marginLeft: '25px' }}
          label='Stroke width:'
          type='number'
          value={this.state.strokeWidth}
          onChange={this._handleStrokeWidthChange}
        />

        <TextField
          label='GeoJSON data:'
          placeholder='GeoJSON'
          multiline
          rowsMax={10}
          fullWidth
          value={this.state.data}
          onChange={this._handleDataChange}
        />

        <div style={{ textAlign: 'center', paddingTop: '1em' }}>
          <Button
            variant='raised'
            color='primary'
            onClick={this._handleClick}
          >
            <ArrowDownward style={{ marginRight: '1em' }} />
            Import GeoJSON
          </Button>
        </div>
      </div>
    )
  }

  _handleStrokeColorChange (value) {
    this.setState({ strokeColor: value })
  }

  _handleFillColorChange (value) {
    this.setState({ fillColor: value })
  }

  _handleStrokeWidthChange (e) {
    this.setState({ strokeWidth: e.target.value })
  }

  _handleDataChange (e) {
    this.setState({ data: e.target.value })
  }

  _handleClick () {
    this.props.setLayerParameter('strokeColor', this.state.strokeColor)
    this.props.setLayerParameter('fillColor', this.state.fillColor)
    this.props.setLayerParameter('strokeWidth', _.toNumber(this.state.strokeWidth))

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

class GeoJSONVectorSource extends React.Component {
  constructor (props) {
    super(props)

    this._assignSourceRef = this._assignSourceRef.bind(this)

    this._sourceRef = undefined

    this.geojsonFormat = new GeoJSON()
    this._updateFeaturesFromProps(props)
  }

  componentDidUpdate () {
    this._updateFeaturesFromProps(this.props)
  }

  _assignSourceRef (value) {
    if (this._sourceRef === value) {
      return
    }

    if (this._sourceRef) {
      const { source } = this._sourceRef
      source.clear()
    }

    this._sourceRef = value

    if (this._sourceRef) {
      this._updateFeaturesFromProps(this.props)
    }
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
    if (this._sourceRef) {
      const { source } = this._sourceRef
      source.clear()
      source.addFeatures(features)
    }
  }

  render () {
    return (
      <source.Vector ref={this._assignSourceRef} />
    )
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
    const strokeColor = parseColor(parameters.strokeColor, primaryColor)
    const fillColor = parseColor(parameters.fillColor, Color(primaryColor).alpha(0.5))
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
