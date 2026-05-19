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
import { hasActiveGeofencePolygon } from '~/features/mission/selectors';
import {
  hasScheduledStartTime,
  isExternalShowUploaded,
  isShowOutdoor,
} from '~/features/show/selectors';
import { getUploadStatusCodeMapping } from '~/features/upload/selectors';
import { isPathUploadedForUav } from '~/features/uavs/pathUpload';
import {
  getUavAlert,
  resolveUavAlertBatteryPercentage,
} from '~/features/uavs/uavAlert';
import {
  createSingleUAVStatusSummarySelector,
  getDeviationFromTakeoffHeadingByUavId,
  getLightColorByUavIdInCSSNotation,
  getUAVById,
} from '~/features/uavs/selectors';
import { UAVAge } from '~/model/uav';
import { getPreferredCoordinateFormatter } from '~/selectors/formatting';
import { formatCoordinateArray } from '~/utils/formatting';

import AlertIndicator from './AlertIndicator';
import FilledListCell from './FilledListCell';
import GPSStatusPill from './GPSStatusPill';
import PathUploadIndicator from './PathUploadIndicator';
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
    margin: theme.spacing(0, 0.25),
    verticalAlign: 'top',
  },
  filledCell: {
    margin: theme.spacing(0, 0.25),
  },
  statusCell: {
    width: 80,
  },
  alertCell: {
    width: 44,
  },
  modePill: {
    width: 48,
  },
  gpsPill: {
    width: 40,
    outline: 'none !important',
  },
  pathCell: {
    marginRight: theme.spacing(2),
    width: 52,
  },
  positionCell: {
    display: 'inline-block',
    marginLeft: theme.spacing(1),
  },
  rssiCell: {
    width: 72,
  },
  batteryCell: {
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    width: 62,
  },
}));

/**
 * Status line in the drone list view that represents a single drone.
 */
const DroneStatusLine = ({
  age,
  alert,
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
  pathUploaded,
  position,
  rssi,
  secondaryLabel,
  text,
  textSemantics = 'info',
  vehicleModePillStyle,
}) => {
  const classes = useStyles();
  const { amsl, ahl, agl } = position || {};
  return (
    <div className={clsx(classes.root, gone && classes.gone)}>
      {padStart(label, 5)}
      <span className={classes.muted}>{padStart(secondaryLabel, 5)}</span>
      {(details || text) &&
        (vehicleModePillStyle ? (
          <FilledListCell
            className={clsx(classes.filledCell, classes.statusCell)}
            style={{
              ...vehicleModePillStyle,
              opacity: age === UAVAge.GONE ? 0.7 : 1,
            }}
          >
            {details || text}
          </FilledListCell>
        ) : (
          <StatusPill
            inline
            className={clsx(classes.pill, classes.statusCell)}
            status={textSemantics}
            hollow={age === UAVAge.GONE}
          >
            {details || text}
          </StatusPill>
        ))}
      {!missing && (
        <>
          <AlertIndicator
            alert={alert}
            className={classes.filledCell}
            width={44}
          />
          <FlightModeStatusPill
            mode={mode}
            className={clsx(classes.pill, classes.modePill)}
          />
          <BatteryIndicator
            className={clsx(classes.filledCell, classes.batteryCell)}
            formatter={batteryFormatter}
            listLevelColors
            {...batteryStatus}
          />
          <ColoredLight inline color={color} />
          <RSSIIndicator
            className={classes.filledCell}
            rssi={rssi}
            width={72}
          />
          <GPSStatusPill
            className={clsx(classes.pill, classes.gpsPill)}
            fixType={gpsFixType}
          />
          <PathUploadIndicator
            className={classes.filledCell}
            uploaded={pathUploaded}
            width={52}
          />
          {localPosition ? (
            <span className={classes.positionCell}>
              {padEnd(localCoordinateFormatter(localPosition), 25)}
            </span>
          ) : position ? (
            <span className={classes.positionCell}>
              {padEnd(coordinateFormatter([position.lon, position.lat]), 25)}
            </span>
          ) : (
            <span className={clsx(classes.muted, classes.positionCell)}>
              {padEnd('no position', 25)}
            </span>
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
  alert: PropTypes.shape({
    label: PropTypes.string,
    level: PropTypes.string,
    title: PropTypes.string,
  }),
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
  pathUploaded: PropTypes.bool,
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
  vehicleModePillStyle: PropTypes.object,
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
      const uploadStatus = getUploadStatusCodeMapping(state)[uavId];
      const batteryFormatter = getBatteryFormatter(state);
      const pathUploadContext = {
        externalShowUploaded: isExternalShowUploaded(state),
      };
      const batteryStatus = uav?.battery;

      return {
        alert: getUavAlert(uav, {
          ...pathUploadContext,
          uploadStatus,
          batteryPercentage: resolveUavAlertBatteryPercentage({
            cellCount: batteryStatus?.cellCount,
            percentage: batteryStatus?.percentage,
            voltage: batteryStatus?.voltage,
            estimatePercentageFromVoltage:
              batteryFormatter.estimatePercentageFromVoltage,
          }),
          geofenceRequired: isShowOutdoor(state),
          geofenceSet: hasActiveGeofencePolygon(state),
          showStartTimeSet: hasScheduledStartTime(state),
        }),
        batteryFormatter,
        color,
        pathUploaded: isPathUploadedForUav(uav, uploadStatus, pathUploadContext),
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
