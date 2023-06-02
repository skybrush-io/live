import PropTypes from 'prop-types';
import React, { useCallback, useMemo, useState } from 'react';
import { connect } from 'react-redux';

import { Circle, Fill, RegularShape, Stroke, Style } from 'ol/style';

import { Feature, Geolocation, geom, layer, source } from '@collmot/ol-react';

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';

import useDeviceOrientation from '~/hooks/useDeviceOrientation';
import { setLayerParametersById } from '~/features/map/layers';
import { toRadians } from '~/utils/math';
import makeLogger from '~/utils/logging';

const logger = makeLogger('OwnLocationLayer');

// === Settings for this particular layer type ===

const OwnLocationLayerSettingsPresentation = ({
  layer: {
    parameters: { showAccuracy, showOrientation },
  },
  setLayerParameters,
}) => {
  const handleChange = (name) => (event) =>
    setLayerParameters({ [name]: event.target.checked });

  return (
    <FormGroup>
      <FormControlLabel
        control={
          <Checkbox
            checked={showAccuracy}
            value='showAccuracy'
            onChange={handleChange('showAccuracy')}
          />
        }
        label='Show accuracy'
      />
      <FormControlLabel
        control={
          <Checkbox
            checked={showOrientation}
            value='showOrientation'
            onChange={handleChange('showOrientation')}
          />
        }
        label='Show orientation'
      />
    </FormGroup>
  );
};

OwnLocationLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  setLayerParameters: PropTypes.func,
};

export const OwnLocationLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameters(parameters) {
      dispatch(setLayerParametersById(ownProps.layerId, parameters));
    },
  })
)(OwnLocationLayerSettingsPresentation);

// === The actual layer to be rendered ===

export const OwnLocationLayer = ({
  layer: {
    parameters: { showAccuracy, showOrientation },
  },
  zIndex,
}) => {
  const [position, setPosition] = useState(null);
  const onPositionChange = useCallback(
    (event) => {
      setPosition(event.target.getPosition());
    },
    [setPosition]
  );
  const positionStyle = useMemo(
    () =>
      new Style({
        image: new Circle({
          radius: 8,
          fill: new Fill({ color: '#00AEEF' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
        }),
      }),
    []
  );

  const [accuracyCoordinates, setAccuracyCoordinates] = useState(null);
  const onAccuracyGeometryChange = useCallback(
    (event) => {
      setAccuracyCoordinates(
        event.target.getAccuracyGeometry().getLinearRing(0).getCoordinates()
      );
    },
    [setAccuracyCoordinates]
  );
  const accuracyStyle = useMemo(
    () =>
      new Style({
        fill: new Fill({ color: 'rgba(255, 255, 255, 0.35)' }),
        stroke: new Stroke({ color: '#00AEEF', width: 2 }),
      }),
    []
  );

  const orientation = useDeviceOrientation({ absolute: true });
  const orientationStyle = useMemo(
    () =>
      new Style({
        image: new RegularShape({
          points: 3,
          fill: new Fill({ color: '#00AEEF' }),
          stroke: new Stroke({ color: '#fff', width: 2 }),
          rotateWithView: true,
          radius: 8,
          scale: [0.75, 1],
          rotation: orientation ? toRadians(-orientation.alpha) : 0,
          displacement: [0, 11],
        }),
      }),
    [orientation]
  );

  const onError = useCallback((event) => {
    logger.warn(`Error while getting position: ${event.message}`);
  }, []);

  return (
    <layer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}>
      <Geolocation
        changePosition={onPositionChange}
        changeAccuracyGeometry={onAccuracyGeometryChange}
        projection='EPSG:3857'
        error={onError}
      />
      <source.Vector>
        {showAccuracy && accuracyCoordinates ? (
          <Feature id='own-location-accuracy' style={accuracyStyle}>
            <geom.Polygon coordinates={accuracyCoordinates} />
          </Feature>
        ) : null}

        {showOrientation && position ? (
          <Feature id='own-location-orientation' style={orientationStyle}>
            <geom.Point coordinates={position} />
          </Feature>
        ) : null}

        {position ? (
          <Feature id='own-location-position' style={positionStyle}>
            <geom.Point coordinates={position} />
          </Feature>
        ) : null}
      </source.Vector>
    </layer.Vector>
  );
};

OwnLocationLayer.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number,
};
