import FlatButton from 'material-ui/FlatButton'
import MenuItem from 'material-ui/MenuItem'
import SelectField from 'material-ui/SelectField'
import TextField from 'material-ui/TextField'
import NavigationCheck from 'material-ui/svg-icons/navigation/check'

import React, { PropTypes } from 'react'
import { layer, source } from 'ol-react'
import { connect } from 'react-redux'

import { setLayerParametersById } from '../../../actions/layers'
import { showSnackbarMessage } from '../../../actions/snackbar'
import { TileServerType, TileServerTypes } from '../../../model/layers'


// === Settings for this particular layer type ===

class TileServerLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this._handleClick = this._handleClick.bind(this)
  }

  render () {
    const serverTypeMenuItems = TileServerTypes.map(type =>
      <MenuItem key={type} value={type} primaryText={type.toUpperCase()} />
    )
    const { parameters } = this.props.layer
    return (
      <div>
        <SelectField ref="type"
          floatingLabelText="Tile server type"
          value={parameters.type}
          onChange={this.props.changeTileServerType}>
          {serverTypeMenuItems}
        </SelectField>
        <TextField ref="url"
          floatingLabelText="Tile server URL"
          defaultValue={parameters.url}
          fullWidth={true} />
        {
          (parameters.type !== TileServerType.XYZ)
          ? (
            <TextField ref="layers"
              floatingLabelText="Layers"
              hintText="Layers to show (comma-separated)"
              defaultValue={parameters.layers}
              fullWidth={true} />
          ) : (
            <div>
              <small>Use <code>{"{x}"}</code>, <code>{"{y}"}</code>,
              <code>{"{-y}"}</code> and <code>{"{z}"}</code> in the server URL template
              for the x and y coordinates and the zoom level. Use tokens like
              <code>{"{a-c}"}</code> to denote multiple servers handling the same
              tileset.</small>
            </div>
          )
        }
        <div style={{ textAlign: 'center', paddingTop: '1em' }}>
          <FlatButton
            label="Save settings"
            icon={<NavigationCheck />}
            onClick={this._handleClick} />
        </div>
      </div>
    )
  }

  _handleClick () {
    const newParams = {}
    if (this.refs.url) {
      newParams['url'] = this.refs.url.getValue()
    }
    if (this.refs.layers) {
      newParams['layers'] = this.refs.layers.getValue()
    }
    this.props.setLayerParameters(newParams)
    this.props.showMessage('Layer settings saved successfully.')
  }
}

TileServerLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,

  changeTileServerType: PropTypes.func,
  setLayerParameters: PropTypes.func,
  showMessage: PropTypes.func
}

export const TileServerLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    changeTileServerType: (event, index, value) => {
      dispatch(setLayerParametersById(ownProps.layerId, {
        type: value
      }))
    },
    setLayerParameters: parameters => {
      dispatch(setLayerParametersById(ownProps.layerId, parameters))
    },
    showMessage: message => {
      dispatch(showSnackbarMessage(message))
    }
  })
)(TileServerLayerSettingsPresentation)

// === The actual layer to be rendered ===

class TileServerLayerPresentation extends React.Component {
  render () {
    if (!this.props.layer.visible) {
      return false
    }

    const mapSource = this._sourceFromParameters(this.props.layer.parameters)
    return (
      <div>
        <layer.Tile zIndex={this.props.zIndex}>{mapSource}</layer.Tile>
      </div>
    )
  }

  _sourceFromParameters (parameters) {
    const { type, url, layers } = parameters
    switch (type) {
      case TileServerType.WMS:
        return (
          <source.TileWMS url={url} params={{
            LAYERS: layers, TILED: true
          }} />
        )

      case TileServerType.XYZ:
        return (
          <source.XYZ url={url} />
        )

      case TileServerType.TILE_CACHE:
        const urlRoot = (url && url.length > 0 && url.charAt(url.length - 1) === '/') ? url : (url + '/')
        const tmsUrl = urlRoot + "1.0.0/" + layers + "/{z}/{x}/{-y}.png"
        return (
          <source.XYZ url={tmsUrl} />
        )

      default:
        return []
    }
  }
}

TileServerLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number
}

export const TileServerLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(TileServerLayerPresentation)
