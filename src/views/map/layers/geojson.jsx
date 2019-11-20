import createColor from 'color';
import _ from 'lodash';
import memoize from 'memoize-one';
import GeoJSON from 'ol/format/GeoJSON';
import Point from 'ol/geom/Point';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { layer as olLayer, source } from '@collmot/ol-react';

import ArrowDownward from '@material-ui/icons/ArrowDownward';
import TextField from '@material-ui/core/TextField';

import Button from '@material-ui/core/Button';
import PopupColorPicker from '../../../components/PopupColorPicker';

import { setLayerParameterById } from '../../../actions/layers';
import { showSnackbarMessage } from '../../../actions/snackbar';

import { parseColor } from '../../../utils/coloring';
import { convertSimpleStyleToOLStyle } from '../../../utils/simplestyle';
import { primaryColor } from '../../../utils/styles';

// === Settings for this particular layer type ===

class GeoJSONLayerSettingsPresentation extends React.Component {
  static propTypes = {
    layer: PropTypes.object,

    setLayerParameter: PropTypes.func,
    showMessage: PropTypes.func
  };

  constructor(props) {
    super(props);

    this.state = {
      strokeColor: props.layer.parameters.strokeColor,
      fillColor: props.layer.parameters.fillColor,
      strokeWidth: props.layer.parameters.strokeWidth,
      data: JSON.stringify(props.layer.parameters.data, null, 2)
    };

    this._handleStrokeColorChange = this._handleStrokeColorChange.bind(this);
    this._handleFillColorChange = this._handleFillColorChange.bind(this);
    this._handleStrokeWidthChange = this._handleStrokeWidthChange.bind(this);
    this._handleDataChange = this._handleDataChange.bind(this);
    this._handleClick = this._handleClick.bind(this);
  }

  render() {
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
          label="Stroke width:"
          type="number"
          value={this.state.strokeWidth}
          onChange={this._handleStrokeWidthChange}
        />

        <TextField
          multiline
          fullWidth
          label="GeoJSON data:"
          placeholder="GeoJSON"
          rowsMax={10}
          value={this.state.data}
          onChange={this._handleDataChange}
        />

        <div style={{ textAlign: 'center', paddingTop: '1em' }}>
          <Button
            variant="contained"
            color="primary"
            onClick={this._handleClick}
          >
            <ArrowDownward style={{ marginRight: '1em' }} />
            Import GeoJSON
          </Button>
        </div>
      </div>
    );
  }

  _handleStrokeColorChange(value) {
    this.setState({ strokeColor: value });
  }

  _handleFillColorChange(value) {
    this.setState({ fillColor: value });
  }

  _handleStrokeWidthChange(e) {
    this.setState({ strokeWidth: e.target.value });
  }

  _handleDataChange(e) {
    this.setState({ data: e.target.value });
  }

  _handleClick() {
    this.props.setLayerParameter('strokeColor', this.state.strokeColor);
    this.props.setLayerParameter('fillColor', this.state.fillColor);
    this.props.setLayerParameter(
      'strokeWidth',
      _.toNumber(this.state.strokeWidth)
    );

    try {
      const parsedData = JSON.parse(this.state.data);
      this.props.setLayerParameter('data', parsedData);
      this.props.showMessage('GeoJSON imported successfully.');
    } catch (_) {
      this.props.showMessage('Invalid GeoJSON data.');
    }
  }
}

export const GeoJSONLayerSettings = connect(
  // mapStateToProps
  () => ({}),
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameter: (parameter, value) => {
      dispatch(setLayerParameterById(ownProps.layerId, parameter, value));
    },
    showMessage: message => {
      dispatch(showSnackbarMessage(message));
    }
  })
)(GeoJSONLayerSettingsPresentation);

GeoJSONLayerSettings.propTypes = {
  layerId: PropTypes.string
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
        featureProjection: 'EPSG:3857'
      });
    } catch (_) {
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
  const { parameters } = layer;
  const styleFunction = React.useMemo(() => {
    const { strokeWidth } = parameters;
    const strokeColor = parseColor(parameters.strokeColor, primaryColor);
    const fillColor = parseColor(
      parameters.fillColor,
      createColor(primaryColor).alpha(0.5)
    );
    console.log(strokeWidth);
    const styleDefaults = {
      stroke: strokeColor.rgb().hex(),
      'stroke-opacity': strokeColor.alpha(),
      'stroke-width': strokeWidth,
      fill: fillColor.rgb().hex(),
      'fill-opacity': fillColor.alpha()
    };
    return feature => {
      const props = feature.getProperties();

      // Force point geometries to always have a marker
      if (!props['marker-symbol'] && feature.getGeometry() instanceof Point) {
        props['marker-symbol'] = 'marker';
      }

      return convertSimpleStyleToOLStyle(props, styleDefaults);
    };
  }, [parameters]);

  return (
    <div>
      <olLayer.Vector zIndex={zIndex} style={styleFunction}>
        <GeoJSONVectorSource data={parameters.data} />
      </olLayer.Vector>
    </div>
  );
};

GeoJSONLayer.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number
};
