import clsx from 'clsx';
import React from 'react';

import { getDatalinkPillStyle } from '~/features/uavs/datalink';
import { formatRSSI } from '~/utils/formatting';

import { FilledListCell, SplitFilledListCell } from './FilledListCell';

export type RSSIIndicatorProps = Readonly<{
  className?: string;
  rssi: number[];
  width?: number;
}>;

/**
 * RSSI / datalink indicator with full-cell background coloring.
 */
export const RSSIIndicator = ({
  className,
  rssi,
  width = 72,
}: RSSIIndicatorProps): React.JSX.Element => {
  if (rssi.length < 2) {
    return (
      <FilledListCell
        className={clsx(className)}
        style={getDatalinkPillStyle(rssi[0])}
        width={width}
      >
        {formatRSSI(rssi[0])}
      </FilledListCell>
    );
  }

  return (
    <SplitFilledListCell
      className={clsx(className)}
      width={width}
      segments={[
        {
          children: formatRSSI(rssi[0]),
          style: getDatalinkPillStyle(rssi[0]),
        },
        {
          children: formatRSSI(rssi[1]),
          style: getDatalinkPillStyle(rssi[1]),
        },
      ]}
    />
  );
};

export default RSSIIndicator;
