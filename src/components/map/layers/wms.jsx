import FlatButton from 'material-ui/FlatButton'
import TextField from 'material-ui/TextField'
import NavigationCheck from 'material-ui/svg-icons/navigation/check'

import React, { PropTypes } from 'react'
import { layer, source } from 'ol-react'
import { connect } from 'react-redux'

import { setLayerParametersById } from '../../../actions/layers'
import { showSnackbarMessage } from '../../../actions/snackbar'

// === Settings for this particular layer type ===

class WMSLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this.handleClick_ = this.handleClick_.bind(this)
  }

  render () {
    return (
      <div>
        <TextField ref="url"
          floatingLabelText="WMS server URL"
          defaultValue={this.props.layer.parameters.url}
          fullWidth={true} />
        <TextField ref="layers"
          floatingLabelText="Layers"
          hintText="Layers to show (comma-separated)"
          defaultValue={this.props.layer.parameters.layers}
          fullWidth={true} />
        <div style={{ textAlign: 'center', paddingTop: '1em' }}>
          <FlatButton
            label="Save settings"
            icon={<NavigationCheck />}
            onClick={this.handleClick_} />
        </div>
      </div>
    )
  }

  handleClick_ () {
    this.props.setLayerParameters({
      url: this.refs.url.getValue(),
      layers: this.refs.layers.getValue()
    })
    this.props.showMessage('Layer settings saved successfully.')
  }
}

WMSLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  setLayerParameters: PropTypes.func,
  showMessage: PropTypes.func
}

export const WMSLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameters: parameters => {
      dispatch(setLayerParametersById(ownProps.layerId, parameters))
    },
    showMessage: (message) => {
      dispatch(showSnackbarMessage(message))
    }
  })
)(WMSLayerSettingsPresentation)

// === The actual layer to be rendered ===

class WMSLayerPresentation extends React.Component {
  render () {
    if (!this.props.layer.visible) {
      return false
    }

    const params = {
      LAYERS: this.props.layer.parameters.layers,
      TILED: true
    }

    return (
      <div>
        <layer.Tile zIndex={this.props.zIndex}>
          <source.TileWMS url={this.props.layer.parameters.url}
            params={params} />
        </layer.Tile>
      </div>
    )
  }
}

WMSLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number
}

export const WMSLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(WMSLayerPresentation)
