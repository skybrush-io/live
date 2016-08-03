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
      data: props.layer.parameters.data
    }

    this.handleChange_ = this.handleChange_.bind(this)
    this.handleClick_ = this.handleClick_.bind(this)
  }

  render () {
    return (
      <div>
        <p key="header">Import GeoJSON data:</p>
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
    try {
      JSON.parse(this.state.data)
      this.props.setLayerParameter('data', this.state.data)
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
  render () {
    if (!this.props.layer.visible) {
      return false
    }

    return (
      <div>
        <layer.Vector zIndex={this.props.zIndex}>
          <GeoJSONVectorSource data={this.props.layer.parameters.data} />
        </layer.Vector>
      </div>
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
