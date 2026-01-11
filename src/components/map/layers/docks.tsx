import { RegularShape, Style, Text } from 'ol/style';
import React from 'react';

import { Feature, geom, layer, source } from '@collmot/ol-react';

import type { DockState } from '~/features/docks/types';
import { dockIdToGlobalId } from '~/model/identifiers';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { fill, shadowThinOutline, shadowVeryThinOutline } from '~/utils/styles';

import type { Identifier } from '~/utils/collections';
import type { BaseFeatureProps } from './types';
import { markAsSelectable } from './utils';

// === Helper functions ===

const createDockStyle = (label: string, selected?: boolean) => [
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

type DockFeatureProps = BaseFeatureProps & {
  selected: boolean;
  value: DockState;
};

const DockFeature = React.memo(function DockFeature({
  selected,
  value,
  ...rest
}: DockFeatureProps) {
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

// === Docks layer ===

type DocksLayerProps = {
  docks: DockState[];
  selectedDockIds: Identifier[];
  zIndex?: number;
};

export const DocksLayer = ({
  docks,
  selectedDockIds,
  zIndex,
}: DocksLayerProps) => (
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
