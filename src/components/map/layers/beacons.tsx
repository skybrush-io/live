import { Circle, Icon, Style, Text } from 'ol/style';
import React from 'react';

// @ts-expect-error: untyped
import { Feature, geom, layer, source } from '@collmot/ol-react';

// @ts-expect-error: untyped
import BeaconImage from '~/../assets/img/beacon-24x24.png';
// @ts-expect-error: untyped
import SelectionGlow from '~/../assets/img/beacon-selection-glow.png';

import { RGBColors } from '~/components/colors';
import { getBeaconDisplayName } from '~/features/beacons/selectors';
import type { Beacon } from '~/features/beacons/types';
import { beaconIdToGlobalId } from '~/model/identifiers';
import { mapViewCoordinateFromLonLat } from '~/utils/geography';
import { fill, shadowVeryThinOutline } from '~/utils/styles';

import type { Identifier } from '~/utils/collections';
import type { BaseFeatureProps } from './types';
import { markAsSelectable } from './utils';

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

// @ts-expect-error: RGBColors doesn't have the right keys.
const activeMarkerStyles = [RGBColors.error, RGBColors.success].map(
  (color: number[]) =>
    new Style({
      image: new Circle({
        displacement: [0, 2],
        fill: fill(color),
        stroke: shadowVeryThinOutline,
        radius: 6,
      }),
    })
);

const createBeaconStyle = (
  label: string,
  selected: boolean,
  active?: boolean | null
) => {
  const styles = [beaconIconStyle];

  if (selected) {
    styles.splice(0, 0, selectionStyle);
  }

  /* "Active" marker in upper left corner */
  if (active !== undefined && active !== null) {
    styles.push(activeMarkerStyles[active ? 1 : 0] as Style);
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

type BeaconFeatureProps = BaseFeatureProps & {
  selected: boolean;
  value: Beacon;
};

const BeaconFeature = React.memo(
  ({ selected, value, ...rest }: BeaconFeatureProps) => {
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
          coordinates={mapViewCoordinateFromLonLat([
            position.lon,
            position.lat,
          ])}
        />
      </Feature>
    );
  }
);

// === Beacons layer

type BeaconsLayerProps = {
  beacons: Beacon[];
  selectedBeaconIds: Identifier[];
  zIndex?: number;
};

export const BeaconsLayer = ({
  beacons,
  selectedBeaconIds,
  zIndex,
}: BeaconsLayerProps) => (
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
