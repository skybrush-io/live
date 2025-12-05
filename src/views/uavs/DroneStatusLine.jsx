import clsx from 'clsx';
import isNil from 'lodash-es/isNil';
import padEnd from 'lodash-es/padEnd';
import padStart from 'lodash-es/padStart';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { makeStyles, monospacedFont } from '@skybrush/app-theme-mui';
import { StatusPill, StatusText } from '@skybrush/mui-components';

import { BatteryFormatter } from '~/components/battery';
import BatteryIndicator from '~/components/BatteryIndicator';
import ColoredLight from '~/components/ColoredLight';
import { getBatteryFormatter } from '~/features/settings/selectors';
import {
  createSingleUAVStatusSummarySelector,
  getDeviationFromTakeoffHeadingByUavId,
  getLightColorByUavIdInCSSNotation,
  getUAVById,
} from '~/features/uavs/selectors';
import { UAVAge } from '~/model/uav';
import { getPreferredCoordinateFormatter } from '~/selectors/formatting';
import { formatCoordinateArray } from '~/utils/formatting';

import GPSStatusPill from './GPSStatusPill';
import RSSIIndicator from './RSSIIndicator';
import FlightModeStatusPill from './FlightModeStatusPill';

/**
 * Converts the absolute value of a heading deviation, in degrees, to the
 * corresponding semantic status that should be used to color the heading info
 * in the status line.
 */
const headingDeviationToStatus = (deviation) => {
  const absDeviation = deviation ? Math.abs(deviation) : 0;
  if (absDeviation >= 20) {
    return 'error';
  }

  if (absDeviation >= 10) {
    return 'warning';
  }

  return undefined;
};

const localCoordinateFormatter = formatCoordinateArray;

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    fontFamily: monospacedFont,
    fontSize: 'small',
    fontVariantNumeric: 'lining-nums tabular-nums',
    userSelect: 'none',
    whiteSpace: 'pre',
  },
  gone: {
    opacity: 0.7,
  },
  muted: {
    color: theme.palette.text.disabled,
  },
  pill: {
    margin: theme.spacing(0, 0.5),
    verticalAlign: 'text-top',
    transform: 'translateY(-1px)',
  },
  statusPill: {
    width: 80,
  },
  modePill: {
    width: 48,
  },
  gpsPill: {
    width: 40,
    outline: 'none !important',
  },
  rssiPills: {
    width: 72,
    paddingLeft: 2,
  },
  batteryIndicator: {
    display: 'inline-block',
    fontFamily: theme.typography.fontFamily,
    textAlign: 'left',
    padding: theme.spacing(0, 0.5),
    margin: theme.spacing(0, 0.5),
    width: '56px !important',
  },
}));

/**
 * Status line in the drone list view that represents a single drone.
 */
const DroneStatusLine = ({
  age,
  batteryFormatter,
  batteryStatus,
  color,
  coordinateFormatter,
  debugString,
  details,
  heading,
  headingDeviation,
  gone,
  gpsFixType,
  label,
  localPosition,
  missing,
  mode,
  position,
  rssi,
  secondaryLabel,
  text,
  textSemantics = 'info',
}) => {
  const classes = useStyles();
  const { amsl, ahl, agl } = position || {};
  return (
    <div className={clsx(classes.root, gone && classes.gone)}>
      {padStart(label, 5)}
      <span className={classes.muted}>{padStart(secondaryLabel, 5)}</span>
      {(details || text) && (
        <StatusPill
          inline
          className={clsx(classes.pill, classes.statusPill)}
          status={textSemantics}
          hollow={age === UAVAge.GONE}
        >
          {details || text}
        </StatusPill>
      )}
      {!missing && (
        <>
          <FlightModeStatusPill
            mode={mode}
            className={clsx(classes.pill, classes.modePill)}
          />
          <BatteryIndicator
            className={classes.batteryIndicator}
            formatter={batteryFormatter}
            {...batteryStatus}
          />
          <ColoredLight inline color={color} />
          <RSSIIndicator className={classes.rssiPills} rssi={rssi} />
          <GPSStatusPill
            className={clsx(classes.pill, classes.gpsPill)}
            fixType={gpsFixType}
          />
          {localPosition ? (
            padEnd(localCoordinateFormatter(localPosition), 25)
          ) : position ? (
            padEnd(coordinateFormatter([position.lon, position.lat]), 25)
          ) : (
            <span className={classes.muted}>{padEnd('no position', 25)}</span>
          )}
          {!isNil(amsl) ? (
            padStart(position.amsl.toFixed(1), 6) + 'm'
          ) : (
            <span className={classes.muted}>{'    ———'}</span>
          )}
          {!isNil(ahl) ? (
            padStart(position.ahl.toFixed(1), 6) + 'm'
          ) : (
            <span className={classes.muted}>{'    ———'}</span>
          )}
          {!isNil(agl) ? (
            padStart(position.agl.toFixed(1), 5) + 'm'
          ) : (
            <span className={classes.muted}>{'   ———'}</span>
          )}
          <StatusText status={headingDeviationToStatus(headingDeviation)}>
            {padStart(!isNil(heading) ? Math.round(heading) + '°' : '', 5)}
          </StatusText>
          <span className={classes.debugString}>
            {debugString ? ' ' + debugString : ''}
          </span>
        </>
      )}
    </div>
  );
};

DroneStatusLine.propTypes = {
  age: PropTypes.oneOf(Object.values(UAVAge)),
  batteryFormatter: PropTypes.instanceOf(BatteryFormatter),
  batteryStatus: PropTypes.shape({
    cellCount: PropTypes.number,
    charging: PropTypes.bool,
    voltage: PropTypes.number,
    percentage: PropTypes.number,
  }),
  color: PropTypes.string,
  coordinateFormatter: PropTypes.func,
  debugString: PropTypes.string,
  details: PropTypes.string,
  editing: PropTypes.bool,
  gone: PropTypes.bool,
  gpsFixType: PropTypes.number,
  heading: PropTypes.number,
  headingDeviation: PropTypes.number,
  id: PropTypes.string,
  label: PropTypes.string,
  localPosition: PropTypes.arrayOf(PropTypes.number),
  missing: PropTypes.bool,
  mode: PropTypes.string,
  position: PropTypes.shape({
    lat: PropTypes.number,
    lon: PropTypes.number,
    amsl: PropTypes.number,
    ahl: PropTypes.number,
    agl: PropTypes.number,
  }),
  rssi: PropTypes.arrayOf(PropTypes.number),
  secondaryLabel: PropTypes.string,
  text: PropTypes.string,
  textSemantics: PropTypes.oneOf([
    'off',
    'info',
    'success',
    'warning',
    'rth',
    'error',
    'critical',
    'missing',
  ]),
};

export default connect(
  // mapStateToProps
  () => {
    const statusSummarySelector = createSingleUAVStatusSummarySelector();
    return (state, ownProps) => {
      const uavId = ownProps.id;
      const uav = getUAVById(state, uavId);
      const headingDeviation = uav
        ? getDeviationFromTakeoffHeadingByUavId(state, uavId)
        : 0;
      const color = uav
        ? getLightColorByUavIdInCSSNotation(state, uavId)
        : 'black';
      return {
        batteryFormatter: getBatteryFormatter(state),
        color,
        coordinateFormatter: getPreferredCoordinateFormatter(state),
        debugString: uav ? uav.debugString : undefined,
        gpsFixType: uav ? uav.gpsFix.type : undefined,
        heading: uav ? uav.heading : undefined,
        headingDeviation,
        localPosition: uav ? uav.localPosition : undefined,
        missing: !uav,
        mode: uav ? uav.mode : undefined,
        position: uav ? uav.position : undefined,
        rssi: uav ? uav.rssi : undefined,
        ...statusSummarySelector(state, ownProps.id),
      };
    };
  }
)(DroneStatusLine);
