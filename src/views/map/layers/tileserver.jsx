import { autobind } from 'core-decorators';
import { layer, source } from '@collmot/ol-react';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import Input from '@material-ui/core/Input';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';

import { setLayerParametersById } from '../../../actions/layers';
import { showSnackbarMessage } from '../../../actions/snackbar';
import { TileServerType, TileServerTypes } from '../../../model/layers';

// === Settings for this particular layer type ===

class TileServerLayerSettingsPresentation extends React.Component {
  constructor(props) {
    super(props);

    const { layers, url } = props.layer.parameters;
    this.state = {
      layers: layers || '',
      url: url || ''
    };
  }

  render() {
    const serverTypeMenuItems = TileServerTypes.map(type => (
      <MenuItem key={type} value={type}>
        {type.toUpperCase()}
      </MenuItem>
    ));
    const { changeTileServerType, layer } = this.props;
    const { url, layers } = this.state;
    const { parameters } = layer;

    return (
      <div>
        <FormControl fullWidth>
          <InputLabel htmlFor="tile-server-type">Tile server type</InputLabel>
          <Select
            value={parameters.type}
            input={<Input id="tile-server-type" />}
            onChange={changeTileServerType}
          >
            {serverTypeMenuItems}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          label="Tile server URL"
          margin="normal"
          value={url}
          onChange={this._onUrlChanged}
        />

        {parameters.type !== TileServerType.XYZ ? (
          <TextField
            fullWidth
            label="Layers"
            margin="normal"
            placeholder="Layers to show (comma-separated)"
            value={layers}
            onChange={this._onLayersChanged}
          />
        ) : (
          <div>
            <small>
              Use <code>{'{x}'}</code>, <code>{'{y}'}</code>,
              <code>{'{-y}'}</code> and <code>{'{z}'}</code> in the server URL
              template for the x and y coordinates and the zoom level. Use
              tokens like
              <code>{'{a-c}'}</code> to denote multiple servers handling the
              same tileset.
            </small>
          </div>
        )}

        <div style={{ textAlign: 'center', paddingTop: '1em' }}>
          <Button onClick={this._handleClick}>Save settings</Button>
        </div>
      </div>
    );
  }

  @autobind
  _onLayersChanged(event) {
    this.setState({ layers: event.target.value });
  }

  @autobind
  _onUrlChanged(event) {
    this.setState({ url: event.target.value });
  }

  @autobind
  _handleClick() {
    const { layers, url } = this.state;
    this.props.setLayerParameters({ layers, url });
    this.props.showMessage('Layer settings saved successfully.');
  }
}

TileServerLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object.isRequired,
  layerId: PropTypes.string.isRequired,

  changeTileServerType: PropTypes.func,
  setLayerParameters: PropTypes.func,
  showMessage: PropTypes.func
};

export const TileServerLayerSettings = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    changeTileServerType: event => {
      dispatch(
        setLayerParametersById(ownProps.layerId, {
          type: event.target.value
        })
      );
    },
    setLayerParameters: parameters => {
      dispatch(setLayerParametersById(ownProps.layerId, parameters));
    },
    showMessage: message => {
      dispatch(showSnackbarMessage(message));
    }
  })
)(TileServerLayerSettingsPresentation);

// === The actual layer to be rendered ===

class TileServerLayerPresentation extends React.Component {
  render() {
    const mapSource = this._sourceFromParameters(this.props.layer.parameters);
    return (
      <div>
        <layer.Tile zIndex={this.props.zIndex}>{mapSource}</layer.Tile>
      </div>
    );
  }

  _sourceFromParameters(parameters) {
    const { type, url, layers } = parameters;
    switch (type) {
      case TileServerType.WMS:
        return (
          <source.TileWMS
            url={url}
            params={{
              LAYERS: layers,
              TILED: true
            }}
          />
        );

      case TileServerType.XYZ:
        return <source.XYZ url={url} />;

      case TileServerType.TILE_CACHE:
        const urlRoot =
          url && url.length > 0 && url.charAt(url.length - 1) === '/'
            ? url
            : url + '/';
        const tmsUrl = urlRoot + '1.0.0/' + layers + '/{z}/{x}/{-y}.png';
        return <source.XYZ url={tmsUrl} />;

      default:
        return [];
    }
  }
}

TileServerLayerPresentation.propTypes = {
  layer: PropTypes.object,
  layerId: PropTypes.string,
  zIndex: PropTypes.number
};

export const TileServerLayer = connect(
  // mapStateToProps
  (state, ownProps) => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({})
)(TileServerLayerPresentation);
