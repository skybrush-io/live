import _ from 'lodash'
import React, { PropTypes } from 'react'
import ol from 'openlayers'
import { layer, source } from 'ol-react'
import { connect } from 'react-redux'

import RaisedButton from 'material-ui/RaisedButton'
import ActionSystemUpdateAlt from 'material-ui/svg-icons/action/system-update-alt'
import TextField from 'material-ui/TextField'

import { setLayerParameterById } from '../../../actions/layers'
import { showSnackbarMessage } from '../../../actions/snackbar'

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
        <p key="header">Import GeoJSON data:</p>

        <span>Stroke color: </span>
        <input ref="strokeColor" type="color"
          defaultValue={this.props.layer.parameters.strokeColor} />
        <span style={{marginLeft: '5px'}}>Fill color: </span>
        <input ref="fillColor" type="color"
          defaultValue={this.props.layer.parameters.fillColor} />

        <br />

        <TextField ref="strokeWidth"
          floatingLabelText="Stroke width:"
          hintText="stroke width"
          type="number"
          style={{width: '130px', marginTop: '-20px'}}
          defaultValue={this.props.layer.parameters.strokeWidth} />
        <TextField ref="fillOpacity"
          floatingLabelText="Fill opacity:"
          hintText="fill opacity"
          type="number"
          style={{width: '130px', marginTop: '-20px', marginLeft: '10px'}}
          defaultValue={this.props.layer.parameters.fillOpacity} />

        <TextField ref="dataTextField"
          floatingLabelText="Paste GeoJSON data here:"
          hintText="GeoJSON"
          multiLine={true}
          rowsMax={10}
          textareaStyle={{height: '85%'}}
          fullWidth={true}
          value={this.state.data}
          onChange={this.handleChange_} />
        <RaisedButton
          label="Import GeoJSON"
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
    this.props.setLayerParameter('strokeColor', this.refs.strokeColor.value)
    this.props.setLayerParameter('fillColor', this.refs.fillColor.value)
    this.props.setLayerParameter('strokeWidth', _.toNumber(this.refs.strokeWidth.getValue()))
    this.props.setLayerParameter('fillOpacity', _.toNumber(this.refs.fillOpacity.getValue()))

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
 * stroke and fill colors.
 *
 * @param {color} stroke the color of the stroke line
 * @param {number} strokeWidth the widht of the stroke
 * @param {color} fill the color of the filling
 * @return {Object} the OpenLayers style object
 */
const makeStrokeFillStyle = (stroke, strokeWidth, fill) => new ol.style.Style({
  stroke: new ol.style.Stroke({ color: stroke, width: strokeWidth }),
  fill: new ol.style.Fill({ color: fill })
})

/**
 * Helper function that makes a HEX color translucent.
 *
 * @param {color} color the color to be made translucent
 * @param {number} opacity how opaque the color should be [0-1]
 * @return {Object} the translucent version of the color
 */
const makeTranslucent = (color, opacity) => {
  const hex = parseInt(color.substring(1), 16)
  return `rgba(${hex >> 16}, ${hex >> 8 & 0xFF}, ${hex & 0xFF}, ${opacity})`
}

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

    this.style = GeoJSONLayerPresentation.makeStyle(props.layer.parameters)
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
    this.style = GeoJSONLayerPresentation.makeStyle(newProps.layer.parameters)
  }

  static makeStyle (parameters) {
    return makeStrokeFillStyle(
      parameters.strokeColor,
      parameters.strokeWidth,
      makeTranslucent(parameters.fillColor, parameters.fillOpacity)
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
