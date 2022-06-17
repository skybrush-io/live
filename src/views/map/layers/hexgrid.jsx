import sum from 'lodash-es/sum';
import toNumber from 'lodash-es/toNumber';
import values from 'lodash-es/values';
import Feature from 'ol/Feature';
import Polygon from 'ol/geom/Polygon';
import { toRadians } from 'ol/math';
import { Fill, Style } from 'ol/style';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import { layer as olLayer, source } from '@collmot/ol-react';

import { setLayerParametersById } from '~/features/map/layers';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';

/**
 * Helper function that creates an OpenLayers fill style object from a color.
 *
 * @param {color} color the color of the filling
 * @return {Object} the OpenLayers style object
 */
const makeFillStyle = (color) =>
  new Style({
    fill: new Fill({ color }),
  });

// === Settings for this particular layer type ===

class HexGridLayerSettingsPresentation extends React.Component {
  static propTypes = {
    layer: PropTypes.object,

    setLayerParameters: PropTypes.func,
  };

  constructor(props) {
    super(props);
    this._inputFields = {};
  }

  render() {
    const { center, size, radius } = this.props.layer.parameters;
    const centerAsString = center ? center.join(', ') : '';

    return (
      <div>
        <TextField
          style={{ paddingRight: '1em' }}
          inputRef={this._assignCenterField}
          label='Center of the grid'
          placeholder='Center (comma separated)'
          defaultValue={centerAsString}
        />
        <TextField
          style={{ paddingRight: '1em' }}
          inputRef={this._assignSizeField}
          label='Size of the grid'
          placeholder='Size'
          defaultValue={String(size)}
        />
        <TextField
          style={{ paddingRight: '1em' }}
          inputRef={this._assignRadiusField}
          label='Radius of one cell'
          placeholder='Radius'
          defaultValue={String(radius)}
        />
        <br />
        &nbsp;
        <br />
        <Button onClick={this._handleClick}>Update hex grid</Button>
      </div>
    );
  }

  _assignCenterField = (value) => {
    this._inputFields.center = value;
  };

  _assignRadiusField = (value) => {
    this._inputFields.radius = value;
  };

  _assignSizeField = (value) => {
    this._inputFields.size = value;
  };

  _handleClick = () => {
    this.props.setLayerParameters({
      center: this._inputFields.center.value.split(',').map(toNumber),
      size: toNumber(this._inputFields.size.value),
      radius: toNumber(this._inputFields.radius.value),
    });
  };
}

export const HexGridLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameters(parameters) {
      dispatch(setLayerParametersById(ownProps.layerId, parameters));
    },
  })
)(HexGridLayerSettingsPresentation);

// === The actual layer to be rendered ===

class HexGridVectorSource extends React.PureComponent {
  componentDidUpdate() {
    if (this._sourceRef) {
      const { source } = this._sourceRef;
      this._drawHexagonsFromProps(this.props, source);
    }
  }

  render() {
    return <source.Vector ref={this._assignSourceRef} />;
  }

  _assignSourceRef = (value) => {
    if (this._sourceRef === value) {
      return;
    }

    if (this._sourceRef) {
      const { source } = this._sourceRef;
      source.clear();
    }

    this._sourceRef = value;
  };

  _getCorners(center, radius) {
    const angles = [30, 90, 150, 210, 270, 330, 30].map(toRadians);
    return angles.map((angle) =>
      mapViewCoordinateFromLonLat([
        center[0] + radius * Math.sin(angle),
        center[1] + radius * Math.cos(angle),
      ])
    );
  }

  _getHexagon(center, radius) {
    return new Feature({
      geometry: new Polygon([this._getCorners(center, radius)]),
    });
  }

  _drawHexagonsFromProps(props, source) {
    const { center, size, radius } = props;

    const features = {};

    for (let x = -size; x <= size; x++) {
      for (
        let z = Math.max(-size, -size - x);
        z <= Math.min(size, size - x);
        z++
      ) {
        const hash = `${x},${z}`;
        features[hash] = this._getHexagon(
          [
            center[0] + radius * 1.5 * x,
            center[1] - radius * Math.sqrt(3) * (0.5 * x + z),
          ],
          radius
        );
        features[hash].setId(hash);
      }
    }

    source.clear();
    source.addFeatures(values(features));

    for (const hash of Object.keys(features)) {
      const coordinates = hash.split(',').map(toNumber);
      const hue = (sum(coordinates.map(Math.abs)) / (size * 2 + 1)) * 115;
      features[hash].setStyle(makeFillStyle(`hsla(${hue}, 70%, 50%, 0.5)`));
    }
  }
}

const HexGridLayerPresentation = ({ layer, zIndex }) => {
  const { center, size, radius } = layer.parameters;
  return (
    <div>
      <olLayer.Vector zIndex={zIndex}>
        <HexGridVectorSource center={center} size={size} radius={radius} />
      </olLayer.Vector>

      <div id='heatmapScale'>
        <span>100%</span>
        <span>50%</span>
        <span>0%</span>
      </div>
    </div>
  );
};

HexGridLayerPresentation.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number,
};

export const HexGridLayer = HexGridLayerPresentation;
