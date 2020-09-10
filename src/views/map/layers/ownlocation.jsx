import PropTypes from 'prop-types';
import React from 'react';

import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { Icon, Style } from 'ol/style';

import { Geolocation, layer, source } from '@collmot/ol-react';

import { toRadians } from '~/utils/math';
import makeLogger from '~/utils/logging';

const LocationIcon = require('~/../assets/img/location-32x32.png').default;

const logger = makeLogger('OwnLocationLayer');

// === Settings for this particular layer type ===

export const OwnLocationLayerSettings = () => false;

// === The actual layer to be rendered ===

class OwnLocationVectorSource extends React.Component {
  static propTypes = {
    onError: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this._sourceRef = undefined;

    this.locationIcon = new Icon({
      rotateWithView: true,
      rotation: 0,
      snapToPixel: false,
      src: LocationIcon,
    });

    this.locationFeature = new Feature();
    this.locationFeature.setStyle(new Style({ image: this.locationIcon }));

    this.accuracyFeature = new Feature();
  }

  componentDidMount() {
    if (window.DeviceOrientationEvent) {
      window.addEventListener(
        'deviceorientation',
        this._onDeviceOrientationChange
      );
    }
  }

  componentWillUnmount() {
    if (window.DeviceOrientationEvent) {
      window.removeEventListener(
        'deviceorientation',
        this._onDeviceOrientationChange
      );
    }
  }

  _assignSourceRef = (value) => {
    if (this._sourceRef === value) {
      return;
    }

    if (this._sourceRef) {
      const { source } = this._sourceRef;
      source.removeFeature(this.locationFeature);
      source.removeFeature(this.accuracyFeature);
    }

    this._sourceRef = value;

    if (this._sourceRef) {
      const { source } = this._sourceRef;
      source.addFeature(this.locationFeature);
      source.addFeature(this.accuracyFeature);
    }
  };

  _logError = (event) => {
    this.props.onError(`Error while getting position: ${event.message}`);
  };

  _onPositionChange = (event) => {
    const coordinates = event.target.getPosition();
    this.locationFeature.setGeometry(
      coordinates ? new Point(coordinates) : null
    );
  };

  _onAccuracyGeometryChange = (event) => {
    const accuracyGeometry = event.target.getAccuracyGeometry();
    this.accuracyFeature.setGeometry(accuracyGeometry);
  };

  _onDeviceOrientationChange = (event) => {
    this.locationIcon.setRotation(toRadians(-event.alpha));

    if (this._sourceRef) {
      this._sourceRef.source.refresh();
    }
  };

  render() {
    return (
      <>
        <Geolocation
          key='location'
          changePosition={this._onPositionChange}
          changeAccuracyGeometry={this._onAccuracyGeometryChange}
          projection='EPSG:3857'
          error={this._logError}
        />
        <source.Vector key='source' ref={this._assignSourceRef} />
      </>
    );
  }
}

export const OwnLocationLayer = ({ zIndex }) => (
  <layer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}>
    <OwnLocationVectorSource onError={logger.warn} />
  </layer.Vector>
);

OwnLocationLayer.propTypes = {
  zIndex: PropTypes.number,
};
