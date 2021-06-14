import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';

import Colors from '~/components/colors';

import { BatteryFormatter, DEFAULT_BATTERY_FORMATTER } from './battery';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      marginTop: theme.spacing(0.5),
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
  }),
  { name: 'BatteryIndicator' }
);

/**
 * Presentational component for a battery charge indicator.
 */
const BatteryIndicator = ({
  charging,
  className,
  cellCount,
  formatter,
  percentage,
  voltage,
}) => {
  const status = formatter.getBatteryStatus(voltage, percentage, cellCount);
  const label = formatter.getBatteryLabel(voltage, percentage, cellCount);
  const batteryIcon = formatter.getBatteryIcon(percentage, status, charging);

  const classes = useStyles();
  const rootClass = clsx(className, classes.root, classes[`battery${status}`]);

  return (
    <Box fontSize='small' className={rootClass}>
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
  percentage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  voltage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

BatteryIndicator.defaultProps = {
  formatter: DEFAULT_BATTERY_FORMATTER,
};

export default BatteryIndicator;
