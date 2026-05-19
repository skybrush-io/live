import Box from '@mui/material/Box';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@skybrush/app-theme-mui';

import Colors from '~/components/colors';
import {
  getBatteryLevelStyle,
  resolveBatteryPercentage,
} from '~/features/uavs/batteryLevel';

import { BatteryFormatter, DEFAULT_BATTERY_FORMATTER } from './battery';

const useStyles = makeStyles((theme) => ({
  root: {
    // marginTop: theme.spacing(0.5),
    padding: '0 2px',
    textAlign: 'center',
    userSelect: 'none',
    width: '100%',
  },

  batteryFull: {
    color: Colors.success,
    fontWeight: 'bold',
  },

  batteryWarning: {
    backgroundColor: Colors.warning,
    borderRadius: `${theme.shape.borderRadius * 2}px`,
    color: theme.palette.getContrastText(Colors.warning),
  },

  batteryError: {
    backgroundColor: Colors.error,
    borderRadius: `${theme.shape.borderRadius * 2}px`,
    color: theme.palette.getContrastText(Colors.error),
    fontWeight: 'bold',
  },
}));

/**
 * Presentational component for a battery charge indicator.
 */
const BatteryIndicator = ({
  charging,
  className,
  cellCount,
  formatter = DEFAULT_BATTERY_FORMATTER,
  listLevelColors = false,
  percentage,
  voltage,
}) => {
  const status = formatter.getBatteryStatus(voltage, percentage, cellCount);
  const label = formatter.getBatteryLabel(voltage, percentage, cellCount);
  const batteryIcon = formatter.getBatteryIcon(percentage, status, charging);

  const classes = useStyles();
  const resolvedPercentage = listLevelColors
    ? resolveBatteryPercentage(
        percentage,
        voltage,
        formatter.estimatePercentageFromVoltage,
        cellCount
      )
    : undefined;
  const listLevelStyle = listLevelColors
    ? getBatteryLevelStyle(resolvedPercentage)
    : undefined;
  const rootClass = clsx(
    className,
    classes.root,
    !listLevelColors && classes[`battery${status}`]
  );

  const listCellSx = listLevelColors
    ? {
        ...listLevelStyle,
        borderRadius: 0,
        boxSizing: 'border-box',
        display: 'inline-block',
        fontWeight: 'bold',
        lineHeight: '22px',
        minHeight: '22px',
        padding: '0 2px',
        verticalAlign: 'top',
      }
    : { fontSize: 'small' };

  return (
    <Box className={rootClass} sx={listCellSx}>
      {batteryIcon}
      {label}
    </Box>
  );
};

BatteryIndicator.propTypes = {
  cellCount: PropTypes.number,
  className: PropTypes.string,
  charging: PropTypes.bool,
  formatter: PropTypes.instanceOf(BatteryFormatter),
  listLevelColors: PropTypes.bool,
  percentage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  voltage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default BatteryIndicator;
