import { Feature, geom } from '@collmot/ol-react';
import { toRadians } from '@skybrush/math';
import memoizeOne from 'memoize-one';
import Icon from 'ol/style/Icon';
import Style from 'ol/style/Style';

import missionOriginMarkerIcon from '~/../assets/img/mission-origin-marker.svg';
import { mapViewCoordinateFromLonLat, type LonLat } from '~/utils/geography';

const orientationMarkerStyle = memoizeOne(
  (orientation: number, color?: string) =>
    new Style({
      image: new Icon({
        src: missionOriginMarkerIcon,
        rotateWithView: true,
        rotation: toRadians(orientation),
        color,
      }),
    })
);

const SKIP_SELECTION = Object.freeze({ skipSelection: true });

export type ArrowProps = {
  orientation: number;
  position: LonLat;
  id: string;
  color?: string;
};

export const Arrow = ({ orientation, position, id, color }: ArrowProps) => (
  <Feature
    key={id}
    id={id}
    properties={SKIP_SELECTION}
    style={orientationMarkerStyle(orientation, color)}
  >
    <geom.Point coordinates={mapViewCoordinateFromLonLat(position)} />
  </Feature>
);

export default Arrow;
