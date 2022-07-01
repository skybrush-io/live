import createColor from 'color';
import toNumber from 'lodash-es/toNumber';
import GeoJSON from 'ol/format/GeoJSON';
import Point from 'ol/geom/Point';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { layer as olLayer, source } from '@collmot/ol-react';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import PopupColorPicker from '~/components/PopupColorPicker';
import { setLayerParametersById } from '~/features/map/layers';
import { showNotification } from '~/features/snackbar/slice';
import { parseColor } from '~/utils/coloring';
import { convertSimpleStyleToOLStyle } from '~/utils/simplestyle';
import { primaryColor } from '~/utils/styles';

// === Settings for this particular layer type ===

class GeoJSONLayerSettingsPresentation extends React.Component {
  static propTypes = {
    layer: PropTypes.object,

    setLayerParameters: PropTypes.func,
    showMessage: PropTypes.func,
  };

  state = {
    strokeWidth: this.props.layer.parameters.strokeWidth,
    data: JSON.stringify(this.props.layer.parameters.data, null, 2),
  };

  render() {
    const { layer } = this.props;
    const { parameters } = layer;
    const { fillColor, strokeColor } = parameters;

    return (
      <Box>
        <Box
          display='flex'
          flexDirection='row'
          alignItems='center'
          justifyContent='space-between'
        >
          <Box>
            <span>Stroke color: </span>
            <PopupColorPicker
              value={strokeColor}
              onChange={this._handleStrokeColorChange}
            />
          </Box>
          <Box>
            <span>Fill color: </span>
            <PopupColorPicker
              value={fillColor}
              onChange={this._handleFillColorChange}
            />
          </Box>

          <TextField
            style={{ marginLeft: 2 }}
            label='Stroke width'
            type='number'
            min='1'
            max='100'
            value={this.state.strokeWidth}
            variant='filled'
            onChange={this._handleStrokeWidthChange}
          />
        </Box>

        <Box pt={2}>
          <TextField
            multiline
            fullWidth
            label='GeoJSON data'
            placeholder='GeoJSON'
            maxRows={10}
            value={this.state.data}
            variant='filled'
            onChange={this._handleDataChange}
          />
        </Box>

        <Box textAlign='center' pt={2}>
          <Button
            variant='contained'
            color='primary'
            onClick={this._handleClick}
          >
            Update layer
          </Button>
        </Box>
      </Box>
    );
  }

  _handleStrokeColorChange = (value) => {
    this.props.setLayerParameters({ strokeColor: value });
  };

  _handleFillColorChange = (value) => {
    this.props.setLayerParameters({ fillColor: value });
  };

  _handleStrokeWidthChange = (event) => {
    this.setState({ strokeWidth: event.target.value });
  };

  _handleDataChange = (event) => {
    this.setState({ data: event.target.value });
  };

  _handleClick = () => {
    this.props.setLayerParameters({
      strokeWidth: toNumber(this.state.strokeWidth),
    });

    try {
      const parsedData = JSON.parse(this.state.data);
      this.props.setLayerParameters({ data: parsedData });
      this.props.showMessage({
        message: 'GeoJSON imported successfully.',
        semantics: 'success',
      });
    } catch {
      this.props.showMessage({
        message: 'Invalid GeoJSON data.',
        semantics: 'error',
      });
    }
  };
}

export const GeoJSONLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameters(parameters) {
      dispatch(setLayerParametersById(ownProps.layerId, parameters));
    },
    showMessage(message) {
      dispatch(showNotification(message));
    },
  })
)(GeoJSONLayerSettingsPresentation);

GeoJSONLayerSettings.propTypes = {
  layerId: PropTypes.string,
};

// === The actual layer to be rendered ===

class GeoJSONVectorSource extends React.Component {
  constructor(props) {
    super(props);

    this._assignSourceRef = this._assignSourceRef.bind(this);

    this._sourceRef = undefined;

    this.geojsonFormat = new GeoJSON();
    this._updateFeaturesFromProps(props);
  }

  componentDidUpdate() {
    this._updateFeaturesFromProps(this.props);
  }

  _assignSourceRef(value) {
    if (this._sourceRef === value) {
      return;
    }

    if (this._sourceRef) {
      const { source } = this._sourceRef;
      source.clear();
    }

    this._sourceRef = value;

    if (this._sourceRef) {
      this._updateFeaturesFromProps(this.props);
    }
  }

  _parseFeatures(data) {
    try {
      return this.geojsonFormat.readFeatures(data, {
        featureProjection: 'EPSG:3857',
      });
    } catch {
      console.error('Failed to parse GeoJSON data in layer');
      return [];
    }
  }

  _updateFeaturesFromProps(props) {
    const features = this._parseFeatures(props.data);
    if (this._sourceRef) {
      const { source } = this._sourceRef;
      source.clear();
      source.addFeatures(features);
    }
  }

  render() {
    return <source.Vector ref={this._assignSourceRef} />;
  }
}

export const GeoJSONLayer = ({ layer, zIndex }) => {
  const styleFunction = React.useMemo(() => {
    const { parameters } = layer;
    const { strokeWidth } = parameters;
    const strokeColor = parseColor(parameters.strokeColor, primaryColor);
    const fillColor = parseColor(
      parameters.fillColor,
      createColor(primaryColor).alpha(0.5)
    );
    const defaults = {
      stroke: strokeColor.rgb().hex(),
      'stroke-opacity': strokeColor.alpha(),
      'stroke-width': strokeWidth,
      fill: fillColor.rgb().hex(),
      'fill-opacity': fillColor.alpha(),
    };
    return (feature) => {
      const properties = feature.getProperties();

      // Force point geometries to always have a marker
      if (
        !properties['marker-symbol'] &&
        feature.getGeometry() instanceof Point
      ) {
        properties['marker-symbol'] = 'marker';
      }

      return convertSimpleStyleToOLStyle(properties, defaults);
    };
  }, [layer]);

  return (
    <div>
      <olLayer.Vector zIndex={zIndex} style={styleFunction}>
        <GeoJSONVectorSource data={layer.parameters.data} />
      </olLayer.Vector>
    </div>
  );
};

GeoJSONLayer.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number,
};
