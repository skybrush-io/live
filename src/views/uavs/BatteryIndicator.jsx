import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';
import Box from '@material-ui/core/Box';
import BatteryAlertIcon from '@material-ui/icons/BatteryAlert';
import Battery20Icon from '@material-ui/icons/Battery20';
import Battery30Icon from '@material-ui/icons/Battery30';
import Battery50Icon from '@material-ui/icons/Battery50';
import Battery60Icon from '@material-ui/icons/Battery60';
import Battery80Icon from '@material-ui/icons/Battery80';
import Battery90Icon from '@material-ui/icons/Battery90';
import BatteryFullIcon from '@material-ui/icons/BatteryFull';

import Colors from '~/components/colors';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      padding: '0 2px',
      textAlign: 'center',
      userSelect: 'none',
      width: '100%'
    },

    batteryFull: {
      color: Colors.success,
      fontWeight: 'bold'
    },

    batteryWarning: {
      backgroundColor: Colors.warning,
      borderRadius: `${theme.shape.borderRadius * 2}px`,
      color: theme.palette.getContrastText(Colors.warning)
    },

    batteryError: {
      backgroundColor: Colors.error,
      borderRadius: `${theme.shape.borderRadius * 2}px`,
      color: theme.palette.getContrastText(Colors.error),
      fontWeight: 'bold'
    }
  }),
  { name: 'BatteryIndicator' }
);

const iconStyle = {
  marginLeft: -8,
  marginTop: -2,
  verticalAlign: 'bottom'
};

const batteryIcons = [
  <BatteryAlertIcon key="batteryIcon" fontSize="small" style={iconStyle} />,
  <BatteryAlertIcon key="batteryIcon" fontSize="small" style={iconStyle} />,
  <Battery20Icon key="batteryIcon" fontSize="small" style={iconStyle} />,
  <Battery30Icon key="batteryIcon" fontSize="small" style={iconStyle} />,
  <Battery50Icon key="batteryIcon" fontSize="small" style={iconStyle} />,
  <Battery50Icon key="batteryIcon" fontSize="small" style={iconStyle} />,
  <Battery60Icon key="batteryIcon" fontSize="small" style={iconStyle} />,
  <Battery80Icon key="batteryIcon" fontSize="small" style={iconStyle} />,
  <Battery80Icon key="batteryIcon" fontSize="small" style={iconStyle} />,
  <Battery90Icon key="batteryIcon" fontSize="small" style={iconStyle} />,
  <BatteryFullIcon key="batteryIcon" fontSize="small" style={iconStyle} />
];

const batteryIconsByStatus = {
  Full: batteryIcons[10],
  Ok: batteryIcons[8],
  Warning: batteryIcons[3],
  Error: batteryIcons[0]
};

// Percentage thresholds for full, normal, low
const percentageThresholds = {
  Full: 95,
  NearFull: 60,
  Ok: 20,
  Warning: 10
};

// Thresholds for full, normal, low
const voltageThresholdsPerCell = {
  Full: 4.1,
  NearFull: 3.9,
  Ok: 3.7,
  Warning: 3.5
};

/**
 * Returns a suggested battery status level, given the voltage and charge
 * percentage of the battery.
 */
function getBatteryStatus(voltage, percentage) {
  if (percentage) {
    return percentage > percentageThresholds.Full
      ? 'Full'
      : percentage > percentageThresholds.NearFull
      ? 'NearFull'
      : percentage > percentageThresholds.Ok
      ? 'Ok'
      : percentage > percentageThresholds.Warning
      ? 'Warning'
      : 'Error';
  }

  const numberCells = 3;
  const voltagePerCell = voltage === undefined ? 0 : voltage / numberCells;
  return voltagePerCell > voltageThresholdsPerCell.Full
    ? 'Full'
    : voltagePerCell > voltageThresholdsPerCell.NearFull
    ? 'NearFull'
    : voltagePerCell > voltageThresholdsPerCell.Ok
    ? 'Ok'
    : voltagePerCell > voltageThresholdsPerCell.Warning
    ? 'Warning'
    : 'Error';
}

/**
 * Presentational component for a battery charge indicator.
 */
const BatteryIndicator = ({ percentage, voltage }) => {
  const classes = useStyles();
  const rootClass = clsx(classes.root, classes[`battery${status}`]);
  const status = getBatteryStatus(voltage, percentage);
  const batteryIcon =
    percentage === undefined
      ? batteryIconsByStatus[status]
      : batteryIcons[Math.round(Math.min(Math.max(percentage, 0), 100) / 10)];

  return (
    <Box fontSize="small" className={rootClass}>
      {batteryIcon}
      {percentage === undefined
        ? voltage === undefined
          ? '???'
          : `${voltage}V`
        : `${percentage}%`}
    </Box>
  );
};

BatteryIndicator.propTypes = {
  percentage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  voltage: PropTypes.oneOfType([PropTypes.number, PropTypes.string])
};

export default BatteryIndicator;
