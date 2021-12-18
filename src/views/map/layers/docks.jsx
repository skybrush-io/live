import { RegularShape, Style, Text } from 'ol/style';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { Feature, geom, layer, source } from '@collmot/ol-react';

import {
  getDocksInOrder,
  getSelectedDockIds,
} from '~/features/docks/selectors';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { dockIdToGlobalId } from '~/model/identifiers';
import { setLayerSelectable } from '~/model/layers';
import { shadowVeryThinOutline, shadowThinOutline, fill } from '~/utils/styles';

// import DockImage from '~/../assets/img/dock-32x32.png';

// === Helper functions ===

const createDockStyle = (label, selected) => [
  new Style({
    image: new RegularShape({
      points: 4,
      fill: fill([255, 136, 0, selected ? 1 : 0.5]),
      stroke: selected ? shadowThinOutline : shadowVeryThinOutline,
      radius: 10,
      rotation: Math.PI / 4,
    }),
  }),
  new Style({
    text: new Text({
      font: '12px sans-serif',
      offsetY: 18,
      placement: 'point',
      text: label,
      textAlign: 'center',
    }),
  }),
];

// === A single feature representing a docking station ===

const DockFeature = React.memo(({ selected, value, ...rest }) => {
  const { id, position } = value;

  if (!position) {
    return null;
  }

  const style = createDockStyle(id, selected);

  return (
    <Feature id={dockIdToGlobalId(id)} style={style} {...rest}>
      <geom.Point
        coordinates={mapViewCoordinateFromLonLat([position.lon, position.lat])}
      />
    </Feature>
  );
});

DockFeature.propTypes = {
  selected: PropTypes.bool,
  value: PropTypes.shape({
    id: PropTypes.string,
    position: PropTypes.shape({
      lat: PropTypes.number.required,
      lon: PropTypes.number.required,
    }),
  }),
};

// === The actual layer to be rendered ===

function markAsSelectable(layer) {
  if (layer) {
    setLayerSelectable(layer.layer);
  }
}

const DocksLayerPresentation = ({ docks, selectedDockIds, zIndex }) => (
  <layer.Vector
    ref={markAsSelectable}
    updateWhileAnimating
    updateWhileInteracting
    zIndex={zIndex}
  >
    <source.Vector>
      {docks.map((dock) => (
        <DockFeature
          key={dock.id}
          value={dock}
          selected={selectedDockIds.includes(dock.id)}
        />
      ))}
    </source.Vector>
  </layer.Vector>
);

DocksLayerPresentation.propTypes = {
  docks: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedDockIds: PropTypes.arrayOf(PropTypes.string).isRequired,
  zIndex: PropTypes.number,
};

export const DocksLayer = connect(
  // mapStateToProps
  (state) => ({
    docks: getDocksInOrder(state),
    selectedDockIds: getSelectedDockIds(state),
  }),
  // mapDispatchToProps
  null
)(DocksLayerPresentation);
