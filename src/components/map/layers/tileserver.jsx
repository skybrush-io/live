import Button from 'material-ui/Button'
import { FormControl } from 'material-ui/Form'
import Input, { InputLabel } from 'material-ui/Input'
import { MenuItem } from 'material-ui/Menu'
import Select from 'material-ui/Select'
import TextField from 'material-ui/TextField'

import { layer, source } from 'ol-react'
import PropTypes from 'prop-types'
import React from 'react'
import { connect } from 'react-redux'

import { setLayerParametersById } from '../../../actions/layers'
import { showSnackbarMessage } from '../../../actions/snackbar'
import { TileServerType, TileServerTypes } from '../../../model/layers'

// === Settings for this particular layer type ===

class TileServerLayerSettingsPresentation extends React.Component {
  constructor (props) {
    super(props)

    this._handleClick = this._handleClick.bind(this)

    this._setURLFieldRef = (value) => { this.urlField = value }
    this._setLayersFieldRef = (value) => { this.layersField = value }
  }

  render () {
    const serverTypeMenuItems = TileServerTypes.map(type =>
      <MenuItem key={type} value={type} primaryText={type.toUpperCase()} />
    )
    const { parameters } = this.props.layer
    return (
      <div>
        <FormControl>
          <InputLabel htmlFor='tile-server-type'>Tile server type</InputLabel>
          <Select
            value={parameters.type}
            onChange={this.props.changeTileServerType}
            input={<Input id='tile-server-type' />}>
            {serverTypeMenuItems}
          </Select>
        </FormControl>

        <TextField ref={this._setURLFieldRef}
          floatingLabelText='Tile server URL'
          defaultValue={parameters.url}
          fullWidth />
        {
          (parameters.type !== TileServerType.XYZ)
            ? (
              <TextField ref={this._setLayersFieldRef}
                floatingLabelText="Layers"
                hintText="Layers to show (comma-separated)"
                defaultValue={parameters.layers}
                fullWidth />
            ) : (
              <div>
                <small>
                  Use <code>{'{x}'}</code>, <code>{'{y}'}</code>,
                  <code>{'{-y}'}</code> and <code>{'{z}'}</code> in the server URL template
                  for the x and y coordinates and the zoom level. Use tokens like
                  <code>{'{a-c}'}</code> to denote multiple servers handling the same
                  tileset.
                </small>
              </div>
            )
        }
        <div style={{ textAlign: 'center', paddingTop: '1em' }}>
          <Button onClick={this._handleClick}>Save settings</Button>
        </div>
      </div>
    )
  }

  _handleClick () {
    const newParams = {}
    if (this.urlField) {
      newParams['url'] = this.urlField.getValue()
    }
    if (this.layersField) {
      newParams['layers'] = this.layersField.getValue()
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
        const tmsUrl = urlRoot + '1.0.0/' + layers + '/{z}/{x}/{-y}.png'
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
