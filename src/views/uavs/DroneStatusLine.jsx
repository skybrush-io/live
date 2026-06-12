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
import {
  getBatteryFormatter,
  isShowingMissionIds,
} from '~/features/settings/selectors';
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
import FilledListCell, { FILLED_LIST_CELL_HEIGHT } from './FilledListCell';
import GPSStatusPill from './GPSStatusPill';
import {
  LIST_ID_COLUMNS,
  listDataColumnStyle,
  listIdColumnStyle,
} from './listColumnLayout';
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

const formatDetailColumnText = (details, text, debugString) => {
  const parts = [];

  if (details && text && details !== text) {
    parts.push(details);
  }

  if (debugString) {
    parts.push(debugString);
  }

  return parts.join(' ');
};

const useStyles = makeStyles((theme) => ({
  root: {
    alignItems: 'center',
    display: 'flex',
    flexGrow: 1,
    flexWrap: 'nowrap',
    fontFamily: monospacedFont,
    fontSize: '0.82rem',
    fontVariantNumeric: 'lining-nums tabular-nums',
    height: FILLED_LIST_CELL_HEIGHT,
    maxHeight: FILLED_LIST_CELL_HEIGHT,
    minHeight: FILLED_LIST_CELL_HEIGHT,
    userSelect: 'none',
  },
  col: {
    boxSizing: 'border-box',
    flexShrink: 0,
    overflow: 'hidden',
  },
  colCenter: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'center',
  },
  colRight: {
    textAlign: 'right',
  },
  gone: {
    opacity: 0.7,
  },
  idLabel: {
    color: theme.palette.text.primary,
    fontSize: '0.82rem',
    fontWeight: 700,
    letterSpacing: '0.02em',
  },
  secondaryIdLabel: {
    color: theme.palette.text.secondary,
    fontSize: '0.78rem',
    fontWeight: 600,
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
  gpsSatsValue: {
    display: 'inline-block',
    textAlign: 'center',
    width: 28,
  },
  positionCell: {
    display: 'inline-block',
    whiteSpace: 'pre',
  },
  rssiCell: {
    width: 72,
  },
  batteryCell: {
    fontFamily: theme.typography.fontFamily,
    textAlign: 'center',
    width: 62,
  },
  detailsCell: {
    flex: '1 1 0',
    lineHeight: `${FILLED_LIST_CELL_HEIGHT}px`,
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
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
  gpsNumSatellites,
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
  showMissionIds = false,
}) => {
  const classes = useStyles();
  const { amsl, ahl, agl } = position || {};
  const idColumns = showMissionIds
    ? LIST_ID_COLUMNS.missionIds
    : LIST_ID_COLUMNS.droneIds;
  const statusLabel = text || details;
  const detailColumnText = formatDetailColumnText(details, text, debugString);

  return (
    <div className={clsx(classes.root, gone && classes.gone)}>
      <div
        className={clsx(classes.col, classes.colRight, classes.idLabel)}
        style={listIdColumnStyle(idColumns.primary)}
      >
        {padStart(label, 5)}
      </div>
      <div
        className={clsx(classes.col, classes.colRight, classes.secondaryIdLabel)}
        style={listIdColumnStyle(idColumns.secondary)}
      >
        {padStart(secondaryLabel, 5)}
      </div>
      {statusLabel && (
        <div
          className={clsx(classes.col, classes.colCenter)}
          style={listDataColumnStyle('status')}
        >
          {vehicleModePillStyle ? (
            <FilledListCell
              className={clsx(classes.filledCell, classes.statusCell)}
              style={{
                ...vehicleModePillStyle,
                opacity: age === UAVAge.GONE ? 0.7 : 1,
              }}
              width={80}
            >
              {statusLabel}
            </FilledListCell>
          ) : (
            <StatusPill
              inline
              className={clsx(classes.pill, classes.statusCell)}
              status={textSemantics}
              hollow={age === UAVAge.GONE}
            >
              {statusLabel}
            </StatusPill>
          )}
        </div>
      )}
      {!missing && (
        <>
          <div
            className={clsx(classes.col, classes.colCenter)}
            style={listDataColumnStyle('alert')}
          >
            <AlertIndicator
              alert={alert}
              className={classes.filledCell}
              width={44}
            />
          </div>
          <div
            className={clsx(classes.col, classes.colCenter)}
            style={listDataColumnStyle('mode')}
          >
            <FlightModeStatusPill
              mode={mode}
              className={clsx(classes.pill, classes.modePill)}
            />
          </div>
          <div
            className={clsx(classes.col, classes.colCenter)}
            style={listDataColumnStyle('battery')}
          >
            <BatteryIndicator
              className={clsx(classes.filledCell, classes.batteryCell)}
              formatter={batteryFormatter}
              listLevelColors
              width={62}
              {...batteryStatus}
            />
          </div>
          <div
            className={clsx(classes.col, classes.colCenter)}
            style={listDataColumnStyle('led')}
          >
            <ColoredLight inline color={color} />
          </div>
          <div
            className={clsx(classes.col, classes.colCenter)}
            style={listDataColumnStyle('rssi')}
          >
            <RSSIIndicator
              className={classes.filledCell}
              rssi={rssi}
              width={72}
            />
          </div>
          <div
            className={clsx(classes.col, classes.colCenter)}
            style={listDataColumnStyle('gps')}
          >
            <GPSStatusPill
              className={clsx(classes.pill, classes.gpsPill)}
              fixType={gpsFixType}
            />
          </div>
          <div
            className={clsx(classes.col, classes.colCenter)}
            style={listDataColumnStyle('sats')}
          >
            <span className={classes.gpsSatsValue}>
              {!isNil(gpsNumSatellites) ? (
                padStart(Math.round(gpsNumSatellites), 2)
              ) : (
                <span className={classes.muted}>{' —'}</span>
              )}
            </span>
          </div>
          <div
            className={clsx(classes.col, classes.colCenter)}
            style={listDataColumnStyle('path')}
          >
            <PathUploadIndicator
              className={classes.filledCell}
              uploaded={pathUploaded}
              width={52}
            />
          </div>
          <div className={classes.col} style={listDataColumnStyle('position')}>
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
          </div>
          <div
            className={clsx(classes.col, classes.colRight)}
            style={listDataColumnStyle('amsl')}
          >
            {!isNil(amsl) ? (
              padStart(position.amsl.toFixed(1), 6) + 'm'
            ) : (
              <span className={classes.muted}>{'    ———'}</span>
            )}
          </div>
          <div
            className={clsx(classes.col, classes.colRight)}
            style={listDataColumnStyle('ahl')}
          >
            {!isNil(ahl) ? (
              padStart(position.ahl.toFixed(1), 6) + 'm'
            ) : (
              <span className={classes.muted}>{'    ———'}</span>
            )}
          </div>
          <div
            className={clsx(classes.col, classes.colRight)}
            style={listDataColumnStyle('agl')}
          >
            {!isNil(agl) ? (
              padStart(position.agl.toFixed(1), 5) + 'm'
            ) : (
              <span className={classes.muted}>{'   ———'}</span>
            )}
          </div>
          <div
            className={clsx(classes.col, classes.colCenter)}
            style={listDataColumnStyle('heading')}
          >
            <StatusText status={headingDeviationToStatus(headingDeviation)}>
              {padStart(!isNil(heading) ? Math.round(heading) + '°' : '', 5)}
            </StatusText>
          </div>
          <div className={clsx(classes.col, classes.detailsCell)}>
            {detailColumnText}
          </div>
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
  gpsNumSatellites: PropTypes.number,
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
  showMissionIds: PropTypes.bool,
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
        gpsNumSatellites: uav?.gpsFix?.numSatellites,
        heading: uav ? uav.heading : undefined,
        headingDeviation,
        localPosition: uav ? uav.localPosition : undefined,
        missing: !uav,
        mode: uav ? uav.mode : undefined,
        position: uav ? uav.position : undefined,
        rssi: uav ? uav.rssi : undefined,
        showMissionIds: isShowingMissionIds(state),
        ...statusSummarySelector(state, ownProps.id),
      };
    };
  }
)(DroneStatusLine);
