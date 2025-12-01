import React from 'react';
import { StatusPill } from '@skybrush/mui-components';

import {
  abbreviateGPSFixType,
  getSemanticsForGPSFixType,
  type GPSFixType,
} from '~/model/enums';

export type GPSStatusPillProps = Readonly<{
  className?: string;
  fixType: GPSFixType;
}>;

export const GPSStatusPill = ({ fixType, ...rest }: GPSStatusPillProps) => {
  const abbreviation = abbreviateGPSFixType(fixType);
  return (
    <StatusPill
      inline
      hollow={Boolean(abbreviation)}
      status={getSemanticsForGPSFixType(fixType)}
      {...rest}
    >
      {abbreviation}
    </StatusPill>
  );
};

export default GPSStatusPill;
