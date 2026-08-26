import { useSelector } from 'react-redux';

import {
  getPreferredCoordinateFormat,
  getPreferredLatitudeCoordinateFormatter,
  getPreferredLongitudeCoordinateFormatter,
} from '~/selectors/formatting';
import { GraticuleLayer as GraticuleLayerPresentation } from './presentation';

type GraticuleLayerProps = {
  zIndex?: number;
};

export const GraticuleLayer = ({ zIndex }: GraticuleLayerProps) => {
  const latFormatter = useSelector(getPreferredLatitudeCoordinateFormatter);
  const lonFormatter = useSelector(getPreferredLongitudeCoordinateFormatter);
  const coordinateformat = useSelector(getPreferredCoordinateFormat);
  return (
    <GraticuleLayerPresentation
      coordinateformat={coordinateformat}
      latFormatter={latFormatter}
      lonFormatter={lonFormatter}
      zIndex={zIndex}
    />
  );
};
