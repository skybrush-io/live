import type { Theme } from '@mui/material/styles';
import makeStyles from '@mui/styles/makeStyles';
import clsx from 'clsx';
import React from 'react';

import StatusPill from '~/components/StatusPill';
import { getSemanticsForRSSI } from '~/model/enums';
import { formatRSSI } from '~/utils/formatting';

export type RSSIIndicatorProps = Readonly<{
  className: string;
  rssi: number[];
}>;

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
}: RSSIIndicatorProps): JSX.Element => {
  const classes = useStyles();
  if (rssi.length < 2) {
    // Show only one RSSI value in a full pill
    return (
      <StatusPill
        inline
        className={clsx(className, classes.pill, classes.pillMargin)}
        status={getSemanticsForRSSI(rssi[0])}
      >
        {formatRSSI(rssi[0])}
      </StatusPill>
    );
  } else {
    // Show two RSSI values in a split pill
    return (
      <div className={clsx(className, classes.group, classes.pillMargin)}>
        <StatusPill
          className={classes.pill}
          position='left'
          status={getSemanticsForRSSI(rssi[0])}
        >
          {formatRSSI(rssi[0])}
        </StatusPill>
        <StatusPill
          className={classes.pill}
          position='right'
          status={getSemanticsForRSSI(rssi[1])}
        >
          {formatRSSI(rssi[1])}
        </StatusPill>
      </div>
    );
  }
};
