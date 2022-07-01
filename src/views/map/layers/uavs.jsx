import { layer as olLayer } from '@collmot/ol-react';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { connect } from 'react-redux';

import Header from '@skybrush/mui-components/lib/FormHeader';

import ActiveUAVsLayerSource from '../sources/ActiveUAVsLayerSource';

import SwatchesColorPicker from '~/components/SwatchesColorPicker';
import { setLayerParametersById } from '~/features/map/layers';
import flock from '~/flock';
import { getSelection } from '~/selectors/selection';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';

// === Settings for this particular layer type ===

const UAVsLayerSettingsPresentation = ({ layer, setLayerParameters }) => {
  const { parameters } = layer;
  const { labelColor } = parameters || {};

  const onColorChanged = useCallback(
    (color) => {
      setLayerParameters({ labelColor: color.hex });
    },
    [setLayerParameters]
  );

  return (
    <>
      <Header>Label color</Header>
      <SwatchesColorPicker
        color={labelColor || '#000000'}
        onChangeComplete={onColorChanged}
      />
    </>
  );
};

UAVsLayerSettingsPresentation.propTypes = {
  layer: PropTypes.object,
  setLayerParameters: PropTypes.func,
};

export const UAVsLayerSettings = connect(
  // mapStateToProps
  null,
  // mapDispatchToProps
  (dispatch, ownProps) => ({
    setLayerParameters(parameters) {
      dispatch(setLayerParametersById(ownProps.layerId, parameters));
    },
  })
)(UAVsLayerSettingsPresentation);

// === The actual layer to be rendered ===

const UAVsLayerPresentation = ({ layer, projection, selection, zIndex }) => (
  <olLayer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}>
    <ActiveUAVsLayerSource
      selection={selection}
      labelColor={layer.parameters.labelColor}
      flock={flock}
      projection={projection}
    />
  </olLayer.Vector>
);

UAVsLayerPresentation.propTypes = {
  layer: PropTypes.object,
  zIndex: PropTypes.number,

  selection: PropTypes.arrayOf(PropTypes.string).isRequired,
  projection: PropTypes.func,
};

UAVsLayerPresentation.defaultProps = {
  projection: mapViewCoordinateFromLonLat,
};

export const UAVsLayer = connect(
  // mapStateToProps
  (state) => ({
    selection: getSelection(state),
  }),
  // mapDispatchToProps
  {}
)(UAVsLayerPresentation);
