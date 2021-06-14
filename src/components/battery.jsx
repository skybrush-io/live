import isNil from 'lodash-es/isNil';
import React from 'react';

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

import { BatterySettings, BatteryStatus } from '~/model/battery';
import { BatteryDisplayStyle } from '~/model/settings';

const batteryIconIndexByStatus = {
  [BatteryStatus.FULL]: 10,
  [BatteryStatus.NEAR_FULL]: 9,
  [BatteryStatus.OK]: 8,
  [BatteryStatus.WARNING]: 3,
  [BatteryStatus.ERROR]: 0,
  [BatteryStatus.UNKNOWN]: 11,
};

const iconStyle = {
  marginLeft: -8,
  marginTop: -2,
  verticalAlign: 'bottom',
};

const unknownIconStyle = {};

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
  <span key='batteryIcon' style={unknownIconStyle}>
    {' '}
  </span>,
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
  <span key='batteryIcon' style={unknownIconStyle} />,
];

/**
 * Formatter that takes what we know about a battery (i.e. what its voltage is,
 * what its charge percentage is, and whether it's charging), and returns a
 * human-readable string, a status color and/or an icon for the battery.
 *
 * The formatter also holds a reference to a BatterySettings object so it knows
 * what the voltage thresholds are.
 */
export class BatteryFormatter {
  constructor({ settings, style = BatteryDisplayStyle.VOLTAGE } = {}) {
    if (settings instanceof BatterySettings) {
      this._settings = settings;
    } else {
      this._settings = new BatterySettings(settings);
    }

    this._style = style;
  }

  getBatteryIcon = (percentage, status, charging) => {
    const index =
      percentage === undefined
        ? batteryIconIndexByStatus[status]
        : Math.round(Math.min(Math.max(percentage, 0), 100) / 10);
    const iconSet = charging ? chargingBatteryIcons : batteryIcons;
    return iconSet[index];
  };

  getBatteryLabel = (voltage, percentage, cellCount) => {
    if (isNil(percentage)) {
      if (isNil(voltage)) {
        return '???';
      } else if (this._style === BatteryDisplayStyle.FORCED_PERCENTAGE) {
        // User wants percentage all the time so let's convert voltage to percentage
        const estimatedPercentage =
          this._settings.estimatePercentageFromVoltage(voltage, cellCount);
        if (isNil(estimatedPercentage)) {
          return `${voltage}V`;
        } else {
          return `${estimatedPercentage}%`;
        }
      } else {
        // No percentage info but we have voltage
        return `${voltage}V`;
      }
    } else {
      // We have percentage
      if (this._style !== BatteryDisplayStyle.VOLTAGE || isNil(voltage)) {
        return `${percentage}%`;
      } else {
        // ...but the user prefers voltage and we have it, so show that one instead
        return `${voltage}V`;
      }
    }
  };

  getBatteryStatus = (voltage, percentage, cellCount) =>
    this._settings
      ? this._settings.getBatteryStatus(voltage, percentage, cellCount)
      : BatteryStatus.UNKNOWN;
}

export const DEFAULT_BATTERY_FORMATTER = new BatteryFormatter();
