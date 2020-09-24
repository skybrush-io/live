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
import BatteryCharging20Icon from '@material-ui/icons/BatteryCharging20';
import BatteryCharging30Icon from '@material-ui/icons/BatteryCharging30';
import BatteryCharging50Icon from '@material-ui/icons/BatteryCharging50';
import BatteryCharging60Icon from '@material-ui/icons/BatteryCharging60';
import BatteryCharging80Icon from '@material-ui/icons/BatteryCharging80';
import BatteryCharging90Icon from '@material-ui/icons/BatteryCharging90';
import BatteryChargingFullIcon from '@material-ui/icons/BatteryChargingFull';

import Colors from '~/components/colors';

const useStyles = makeStyles(
  (theme) => ({
    root: {
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

const iconStyle = {
  marginLeft: -8,
  marginTop: -2,
  verticalAlign: 'bottom',
};

const batteryIcons = [
  <BatteryAlertIcon key='batteryIcon' fontSize='small' style={iconStyle} />,
  <BatteryAlertIcon key='batteryIcon' fontSize='small' style={iconStyle} />,
  <Battery20Icon key='batteryIcon' fontSize='small' style={iconStyle} />,
  <Battery30Icon key='batteryIcon' fontSize='small' style={iconStyle} />,
  <Battery50Icon key='batteryIcon' fontSize='small' style={iconStyle} />,
  <Battery50Icon key='batteryIcon' fontSize='small' style={iconStyle} />,
  <Battery60Icon key='batteryIcon' fontSize='small' style={iconStyle} />,
  <Battery80Icon key='batteryIcon' fontSize='small' style={iconStyle} />,
  <Battery80Icon key='batteryIcon' fontSize='small' style={iconStyle} />,
  <Battery90Icon key='batteryIcon' fontSize='small' style={iconStyle} />,
  <BatteryFullIcon key='batteryIcon' fontSize='small' style={iconStyle} />,
];

const chargingBatteryIcons = [
  <BatteryCharging20Icon
    key='batteryIcon'
    fontSize='small'
    style={iconStyle}
  />,
  <BatteryCharging20Icon
    key='batteryIcon'
    fontSize='small'
    style={iconStyle}
  />,
  <BatteryCharging20Icon
    key='batteryIcon'
    fontSize='small'
    style={iconStyle}
  />,
  <BatteryCharging30Icon
    key='batteryIcon'
    fontSize='small'
    style={iconStyle}
  />,
  <BatteryCharging50Icon
    key='batteryIcon'
    fontSize='small'
    style={iconStyle}
  />,
  <BatteryCharging50Icon
    key='batteryIcon'
    fontSize='small'
    style={iconStyle}
  />,
  <BatteryCharging60Icon
    key='batteryIcon'
    fontSize='small'
    style={iconStyle}
  />,
  <BatteryCharging80Icon
    key='batteryIcon'
    fontSize='small'
    style={iconStyle}
  />,
  <BatteryCharging80Icon
    key='batteryIcon'
    fontSize='small'
    style={iconStyle}
  />,
  <BatteryCharging90Icon
    key='batteryIcon'
    fontSize='small'
    style={iconStyle}
  />,
  <BatteryChargingFullIcon
    key='batteryIcon'
    fontSize='small'
    style={iconStyle}
  />,
];

const batteryIconIndexByStatus = {
  Full: 10,
  NearFull: 9,
  Ok: 8,
  Warning: 3,
  Error: 0,
};

const getBatteryIcon = (percentage, status, charging) => {
  const index =
    percentage === undefined
      ? batteryIconIndexByStatus[status]
      : Math.round(Math.min(Math.max(percentage, 0), 100) / 10);
  const iconSet = charging ? chargingBatteryIcons : batteryIcons;
  return iconSet[index];
};

const batteryIconsByStatus = {
  Full: batteryIcons[10],
  NearFull: batteryIcons[9],
  Ok: batteryIcons[8],
  Warning: batteryIcons[3],
  Error: batteryIcons[0],
};

// Percentage thresholds for full, normal, low
const percentageThresholds = {
  Full: 95,
  NearFull: 60,
  Ok: 20,
  Warning: 10,
};

// Thresholds for full, normal, low
const voltageThresholdsPerCell = {
  Full: 4.1,
  NearFull: 3.9,
  Ok: 3.7,
  Warning: 3.5,
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
const BatteryIndicator = ({ charging, className, percentage, voltage }) => {
  const classes = useStyles();
  const status = getBatteryStatus(voltage, percentage);
  const rootClass = clsx(className, classes.root, classes[`battery${status}`]);
  const batteryIcon = getBatteryIcon(percentage, status, charging);
  return (
    <Box fontSize='small' className={rootClass}>
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
  className: PropTypes.string,
  charging: PropTypes.bool,
  percentage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  voltage: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

export default BatteryIndicator;
