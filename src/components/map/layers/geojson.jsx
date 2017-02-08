import _ from 'lodash'
import React, { PropTypes } from 'react'
import ol from 'openlayers'
import { layer, source } from 'ol-react'
import { connect } from 'react-redux'

import TextField from 'material-ui/TextField'

import PopupColorPicker from '../../PopupColorPicker'

import RaisedButton from 'material-ui/RaisedButton'
import ActionSystemUpdateAlt from 'material-ui/svg-icons/action/system-update-alt'

import { setLayerParameterById } from '../../../actions/layers'
import { showSnackbarMessage } from '../../../actions/snackbar'

import { colorToString } from '../../../utils/coloring.js'

// === Settings for this particular layer type ===

class GeoJSONLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.state = {
      data: JSON.stringify(props.layer.parameters.data, null, 2)
    }

    this.handleChange_ = this.handleChange_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)
  }

  render () {
    return (
      <div>
        <span>Stroke color: </span>
        <PopupColorPicker ref={'strokeColor'}
          defaultValue={this.props.layer.parameters.strokeColor} />
        <span style={{ marginLeft: '25px' }}>Fill color: </span>
        <PopupColorPicker ref={'fillColor'}
          defaultValue={this.props.layer.parameters.fillColor} />

        <TextField ref={'strokeWidth'}
          floatingLabelText={'Stroke width:'}
          hintText={'stroke width'}
          type={'number'}
          defaultValue={this.props.layer.parameters.strokeWidth} />

        <TextField ref={'dataTextField'}
          floatingLabelText={'Paste GeoJSON data here:'}
          hintText={'GeoJSON'}
          multiLine
          rowsMax={10}
          textareaStyle={{height: '85%'}}
          fullWidth
          value={this.state.data}
          onChange={this.handleChange_} />
        <RaisedButton
          label={'Import GeoJSON'}
          icon={<ActionSystemUpdateAlt />}
          onClick={this.handleClick_} />
      </div>
    )
  }

  handleChange_ (e) {
    this.setState({
      data: e.target.value
    })
  }

  handleClick_ () {
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

/**
 * Helper function that creates an OpenLayers style object from
 * stroke and fill colors. (+ stroke width)
 *
 * @param {color} stroke the color of the stroke line
 * @param {number} strokeWidth the widht of the stroke
 * @param {color} fill the color of the filling
 * @param {string} text the text displayed on the features
 * @return {Object} the OpenLayers style object
 */
const makeStrokeFillStyle = (stroke, strokeWidth, fill, text) => new ol.style.Style({
  stroke: new ol.style.Stroke({color: stroke, width: strokeWidth}),
  fill: new ol.style.Fill({color: fill}),
  text: new ol.style.Text({
    text: text,
    font: '12.5px Century Gothic',
    stroke: new ol.style.Stroke({color: stroke})
  })
})

class GeoJSONVectorSource extends source.Vector {
  constructor (props) {
    super(props)

    this.geojsonFormat = new ol.format.GeoJSON()

    this.source.addFeatures(this.geojsonFormat.readFeatures(
      props.data, {featureProjection: 'EPSG:3857'}
    ))
  }

  componentWillReceiveProps (newProps) {
    this.source.clear()

    this.source.addFeatures(this.geojsonFormat.readFeatures(
      newProps.data, {featureProjection: 'EPSG:3857'}
    ))
  }
}

class GeoJSONLayerPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.style = GeoJSONLayerPresentation.makeStyle(props.layer)
  }

  render () {
    if (!this.props.layer.visible) {
      return false
    }

    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex} style={this.style}>
          <GeoJSONVectorSource data={this.props.layer.parameters.data} />
        </layer.Vector>
      </div>
    )
  }

  componentWillReceiveProps (newProps) {
    this.style = GeoJSONLayerPresentation.makeStyle(newProps.layer)
  }

  static makeStyle (layer) {
    return makeStrokeFillStyle(
      colorToString(layer.parameters.strokeColor),
      layer.parameters.strokeWidth,
      colorToString(layer.parameters.fillColor),
      layer.label
    )
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
