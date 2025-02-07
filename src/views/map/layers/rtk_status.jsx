import { RegularShape, Style } from 'ol/style';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { Feature, geom, layer, source } from '@collmot/ol-react';

import { getUAVsInOrder } from '~/features/uavs/selectors';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { dockIdToGlobalId } from '~/model/identifiers';
import { shadowVeryThinOutline, fill } from '~/utils/styles';

import Fill from 'ol/style/Fill.js';

// === Helper functions ===

const createRTKStyle = (fill_color) => [
  new Style({
    image: new RegularShape({
      // points: 4,
      // fill: fill_color,
      // stroke: shadowVeryThinOutline,
      // radius: 15,
      // angle: Math.PI / 4,
      fill: fill_color,
      stroke: shadowVeryThinOutline,
      points: 3,
      radius: 15,
      angle: Math.PI / 4,
    }),
  }),
];

// === A single feature representing a docking station ===

const RTKFeature = React.memo(({ uav, ...rest }) => {
  const { id, position, rssi ,gpsFix } = uav;

  if (!position) {
    return null;
  }

  let fill_color = new Fill({color: 'red'});
  if(gpsFix?.type==3){fill_color = new Fill({color: 'red'});}
  if(gpsFix?.type>3){fill_color = new Fill({color: 'green'});}

  const style = createRTKStyle(fill_color);

  return (
    <Feature id={dockIdToGlobalId(id)} style={style} {...rest}>
      <geom.Point
        coordinates={mapViewCoordinateFromLonLat([position.lon, position.lat])}
      />
    </Feature>
  );
});

RTKFeature.propTypes = {
  selected: PropTypes.bool,
  uav: PropTypes.shape({
    id: PropTypes.string,
    position: PropTypes.shape({
      lat: PropTypes.number.required,
      lon: PropTypes.number.required,
    }),
    rssi: PropTypes.arrayOf(PropTypes.number),
  }),
};

// === The actual layer to be rendered ===

const RTKLayerPresentation = ({ uavs, zIndex }) => (
  <layer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}>
    <source.Vector>
      {uavs.map((uav) => (
        <RTKFeature key={uav.id} uav={uav} />
      ))}
    </source.Vector>
  </layer.Vector>
);

RTKLayerPresentation.propTypes = {
  uavs: PropTypes.arrayOf(PropTypes.object).isRequired,
  zIndex: PropTypes.number,
};

export const RTKLayer = connect(
  // mapStateToProps
  (state) => ({
    uavs: getUAVsInOrder(state),
  }),
  // mapDispatchToProps
  null
)(RTKLayerPresentation);
