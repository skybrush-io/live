import { Circle, Icon, Style, Text } from 'ol/style';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { Feature, geom, layer, source } from '@collmot/ol-react';

import BeaconImage from '~/../assets/img/beacon-24x24.png';
import SelectionGlow from '~/../assets/img/beacon-selection-glow.png';

import { RGBColors } from '~/components/colors';
import {
  getBeaconDisplayName,
  getBeaconsInOrder,
  getSelectedBeaconIds,
} from '~/features/beacons/selectors';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { beaconIdToGlobalId } from '~/model/identifiers';
import { setLayerSelectable } from '~/model/layers';
import { shadowVeryThinOutline, fill } from '~/utils/styles';

// === Helper functions ===

const beaconIconStyle = new Style({
  image: new Icon({
    src: BeaconImage,
  }),
});

const selectionStyle = new Style({
  image: new Icon({
    src: SelectionGlow,
  }),
});

const activeMarkerStyles = [RGBColors.error, RGBColors.success].map(
  (color) =>
    new Style({
      image: new Circle({
        displacement: [0, 2],
        fill: fill(color),
        stroke: shadowVeryThinOutline,
        radius: 6,
      }),
    })
);

const createBeaconStyle = (label, selected, active) => {
  const styles = [beaconIconStyle];

  if (selected) {
    styles.splice(0, 0, selectionStyle);
  }

  /* "Active" marker in upper left corner */
  if (active !== undefined && active !== null) {
    styles.push(activeMarkerStyles[active ? 1 : 0]);
  }

  styles.push(
    /* Label */
    new Style({
      text: new Text({
        font: '12px sans-serif',
        offsetY: 18,
        placement: 'point',
        text: label,
        textAlign: 'center',
      }),
    })
  );

  return styles;
};

// === A single feature representing a beacon ===

const BeaconFeature = React.memo(({ selected, value, ...rest }) => {
  const { id, position, active } = value;

  if (!position) {
    return null;
  }

  const style = createBeaconStyle(
    getBeaconDisplayName(value),
    selected,
    active
  );

  return (
    <Feature id={beaconIdToGlobalId(id)} style={style} {...rest}>
      <geom.Point
        coordinates={mapViewCoordinateFromLonLat([position.lon, position.lat])}
      />
    </Feature>
  );
});

BeaconFeature.propTypes = {
  selected: PropTypes.bool,
  value: PropTypes.shape({
    id: PropTypes.string,
    position: PropTypes.shape({
      lat: PropTypes.number.required,
      lon: PropTypes.number.required,
    }),
    heading: PropTypes.number,
    active: PropTypes.bool,
  }),
};

// === The actual layer to be rendered ===

function markAsSelectable(layer) {
  if (layer) {
    setLayerSelectable(layer.layer);
  }
}

const BeaconsLayerPresentation = ({ beacons, selectedBeaconIds, zIndex }) => (
  <layer.Vector
    ref={markAsSelectable}
    updateWhileAnimating
    updateWhileInteracting
    zIndex={zIndex}
  >
    <source.Vector>
      {beacons.map((beacon) => (
        <BeaconFeature
          key={beacon.id}
          value={beacon}
          selected={selectedBeaconIds.includes(beacon.id)}
        />
      ))}
    </source.Vector>
  </layer.Vector>
);

BeaconsLayerPresentation.propTypes = {
  beacons: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedBeaconIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  zIndex: PropTypes.number,
};

export const BeaconsLayer = connect(
  // mapStateToProps
  (state) => ({
    beacons: getBeaconsInOrder(state),
    selectedBeaconIds: getSelectedBeaconIds(state),
  }),
  // mapDispatchToProps
  null
)(BeaconsLayerPresentation);
