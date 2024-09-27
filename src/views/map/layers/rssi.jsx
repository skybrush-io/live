import { Circle, Style } from 'ol/style';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { Feature, geom, layer, source } from '@collmot/ol-react';

import { getUAVsInOrder } from '~/features/uavs/selectors';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { shadowVeryThinOutline, fill } from '~/utils/styles';

// === Helper functions ===

const createRSSIStyle = (rssi) => [
  new Style({
    image: new Circle({
      fill: fill(`hsl(${rssi}, 100%, 50%)`),
      stroke: shadowVeryThinOutline,
      radius: 15,
    }),
  }),
];

// === A single feature representing an RSSI measurement ===

const RSSIFeature = React.memo(({ uav, ...rest }) => {
  const { id, position, rssi } = uav;

  if (!position) {
    return null;
  }

  const style = createRSSIStyle(rssi[0]);

  return (
    <Feature id={`uav-rssi-${id}`} style={style} {...rest}>
      <geom.Point
        coordinates={mapViewCoordinateFromLonLat([position.lon, position.lat])}
      />
    </Feature>
  );
});

RSSIFeature.propTypes = {
  selected: PropTypes.bool,
  uav: PropTypes.shape({
    id: PropTypes.string,
    position: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lon: PropTypes.number.isRequired,
    }),
    rssi: PropTypes.arrayOf(PropTypes.number),
  }),
};

// === The actual layer to be rendered ===

const RSSILayerPresentation = ({ uavs, zIndex }) => (
  <layer.Vector updateWhileAnimating updateWhileInteracting zIndex={zIndex}>
    <source.Vector>
      {uavs.map((uav) => (
        <RSSIFeature key={uav.id} uav={uav} />
      ))}
    </source.Vector>
  </layer.Vector>
);

RSSILayerPresentation.propTypes = {
  uavs: PropTypes.arrayOf(PropTypes.object).isRequired,
  zIndex: PropTypes.number,
};

export const RSSILayer = connect(
  // mapStateToProps
  (state) => ({
    uavs: getUAVsInOrder(state),
  }),
  // mapDispatchToProps
  null
)(RSSILayerPresentation);
