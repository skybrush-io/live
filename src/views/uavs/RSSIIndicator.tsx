import type { Theme } from '@mui/material/styles';
import clsx from 'clsx';
import React, { type CSSProperties } from 'react';

import { makeStyles } from '@skybrush/app-theme-mui';
import {
  StatusPill,
  type StatusPillProps,
} from '@skybrush/mui-components';

import {
  getDatalinkPillStyle,
  getSemanticsForDatalink,
} from '~/features/uavs/datalink';
import { formatRSSI } from '~/utils/formatting';

export type RSSIIndicatorProps = Readonly<{
  className: string;
  rssi: number[];
}>;

/** StatusPill forwards `style` at runtime but omits it from its public types. */
const StatusPillWithStyle = StatusPill as React.FC<
  StatusPillProps & { style?: CSSProperties }
>;

const useStyles = makeStyles((theme: Theme) => ({
  group: {
    display: 'inline-flex',
    flexDirection: 'row',
    transform: 'translateY(1px)',
  },
  pill: {
    verticalAlign: 'text-top',
    transform: 'translateY(-1px)',
  },
  pillMargin: {
    margin: theme.spacing(0, 0.5),
  },
}));

/**
 * RSSI indicator component optimized to show one or two RSSI values at most,
 * in a nice compact split-pill layout.
 */
export const RSSIIndicator = ({
  className,
  rssi,
}: RSSIIndicatorProps): React.JSX.Element => {
  const classes = useStyles();
  if (rssi.length < 2) {
    // Show only one RSSI value in a full pill
    return (
      <StatusPillWithStyle
        inline
        className={clsx(className, classes.pill, classes.pillMargin)}
        status={getSemanticsForDatalink(rssi[0])}
        style={getDatalinkPillStyle(rssi[0])}
      >
        {formatRSSI(rssi[0])}
      </StatusPillWithStyle>
    );
  } else {
    // Show two RSSI values in a split pill
    return (
      <div className={clsx(className, classes.group, classes.pillMargin)}>
        <StatusPillWithStyle
          className={classes.pill}
          position='left'
          status={getSemanticsForDatalink(rssi[0])}
          style={getDatalinkPillStyle(rssi[0])}
        >
          {formatRSSI(rssi[0])}
        </StatusPillWithStyle>
        <StatusPillWithStyle
          className={classes.pill}
          position='right'
          status={getSemanticsForDatalink(rssi[1])}
          style={getDatalinkPillStyle(rssi[1])}
        >
          {formatRSSI(rssi[1])}
        </StatusPillWithStyle>
      </div>
    );
  }
};

export default RSSIIndicator;
