import toNumber from 'lodash-es/toNumber';
import Feature from 'ol/Feature';
import LineString from 'ol/geom/LineString';
import Style from 'ol/style/Style';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { layer as olLayer, source } from '@collmot/ol-react';

import TextField from '@material-ui/core/TextField';

import SwatchesColorPicker from '~/components/SwatchesColorPicker';
import { setLayerParametersById } from '~/features/map/layers';
import flock from '~/flock';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { primaryColor, stroke } from '~/utils/styles';

// === Settings for this particular layer type ===

class UAVTraceLayerSettingsPresentation extends React.Component {
  static propTypes = {
    layer: PropTypes.object,
    setLayerParameters: PropTypes.func,
  };

  render() {
    const { layer } = this.props;
    const parameters = {
      trailColor: primaryColor,
      trailLength: 10,
      trailWidth: 2,
      ...layer.parameters,
    };
    const { trailColor, trailLength, trailWidth } = parameters;

    return (
      <div>
        <TextField
          style={{ paddingRight: '1em', width: 150 }}
          label='Trail length'
          placeholder='Samples'
          type='number'
          value={trailLength}
          onChange={this._onTrailLengthChanged}
        />
        <TextField
          style={{ paddingRight: '1em', width: 150 }}
          label='Trail width'
          placeholder='Pixels'
          type='number'
          value={trailWidth}
          onChange={this._onTrailWidthChanged}
        />
        <div style={{ paddingTop: '0.5em' }}>
          <SwatchesColorPicker
            color={trailColor || primaryColor}
            onChangeComplete={this._onColorChanged}
          />
        </div>
      </div>
    );
  }

  _onColorChanged = (color) => {
    this.props.setLayerParameters({
      trailColor: color.hex,
    });
  };

  _onTrailLengthChanged = (event) => {
    const value = toNumber(event.target.value);
    if (value > 0 && Number.isFinite(value)) {
      this.props.setLayerParameters({
        trailLength: value,
      });
    }
  };

  _onTrailWidthChanged = (event) => {
    const value = toNumber(event.target.value);
    if (value > 0 && value < 20) {
      this.props.setLayerParameters({
        trailWidth: value,
      });
    }
  };
}

export const UAVTraceLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameters(parameters) {
      dispatch(setLayerParametersById(ownProps.layerId, parameters));
    },
  })
)(UAVTraceLayerSettingsPresentation);

// === The actual layer to be rendered ===

class UAVTraceVectorSource extends React.Component {
  static propTypes = {
    trailLength: PropTypes.number,
    trailColor: PropTypes.string,
    trailWidth: PropTypes.number,
  };

  constructor(props) {
    super(props);

    this.features = [];
    this.lineStringsById = {};

    this._sourceRef = undefined;

    flock.uavsUpdated.add(this._handleUpdate);
  }

  _assignSourceRef = (value) => {
    if (value === this._sourceRef) {
      return;
    }

    if (this._sourceRef) {
      this._sourceRef.source.clear();
    }

    this._sourceRef = value;

    if (this._sourceRef) {
      this._sourceRef.source.addFeatures(this.features);
    }
  };

  _handleUpdate = (uavs) => {
    for (const uav of uavs) {
      if (uav._id in this.lineStringsById) {
        // UAV exists, just extend its trace
        this.lineStringsById[uav._id].appendCoordinate(
          mapViewCoordinateFromLonLat([uav.lon, uav.lat])
        );
      } else {
        // UAV does not exist yet, add a new trace
        this.lineStringsById[uav._id] = new LineString([
          mapViewCoordinateFromLonLat([uav.lon, uav.lat]),
        ]);
        this._registerNewFeature(new Feature(this.lineStringsById[uav._id]));
      }

      // Forget old coordinates from the trace
      while (
        this.lineStringsById[uav._id].getCoordinates().length >
        this.props.trailLength
      ) {
        this.lineStringsById[uav._id].setCoordinates(
          this.lineStringsById[uav._id].getCoordinates().slice(1)
        );
      }
    }
  };

  _registerNewFeature = (feature) => {
    this._updateFeatureStyle(feature);
    this.features.push(feature);
    if (this._sourceRef) {
      this._sourceRef.source.addFeature(feature);
    }
  };

  _updateFeatureStyle = (feature) => {
    feature.setStyle(
      new Style({
        stroke: stroke(this.props.trailColor, this.props.trailWidth),
      })
    );
  };

  componentDidUpdate() {
    if (this._sourceRef) {
      const features = this._sourceRef.source.getFeatures();

      // Update the styles of all the features
      for (const feature of features) {
        this._updateFeatureStyle(feature);
      }
    }
  }

  render() {
    return <source.Vector ref={this._assignSourceRef} />;
  }
}

const UAVTraceLayerPresentation = ({ layer, zIndex }) => (
  <olLayer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}>
    <UAVTraceVectorSource
      trailLength={layer.parameters.trailLength}
      trailColor={layer.parameters.trailColor}
      trailWidth={layer.parameters.trailWidth}
    />
  </olLayer.Vector>
);

UAVTraceLayerPresentation.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number,
};

export const UAVTraceLayer = UAVTraceLayerPresentation;
