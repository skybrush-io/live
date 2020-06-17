import clsx from 'clsx';
import isNil from 'lodash-es/isNil';
import padEnd from 'lodash-es/padEnd';
import padStart from 'lodash-es/padStart';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';

import BatteryIndicator from './BatteryIndicator';

import ColoredLight from '~/components/ColoredLight';
import StatusPill from '~/components/StatusPill';
import StatusText from '~/components/StatusText';
import {
  createSingleUAVStatusSummarySelector,
  getDeviationFromTakeoffHeadingByUavId,
  getLightColorByUavIdInCSSNotation,
} from '~/features/uavs/selectors';
import {
  abbreviateFlightMode,
  abbreviateGPSFixType,
  GPSFixType,
} from '~/model/enums';
import { getPreferredCoordinateFormatter } from '~/selectors/formatting';
import { monospacedFont } from '~/theme';

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

const gpsFixTypeToStatus = (status) => {
  if (status === GPSFixType.FIX_3D) {
    return 'warning';
  }

  if (
    status === GPSFixType.DGPS ||
    status === GPSFixType.RTK_FIXED ||
    status === GPSFixType.RTK_FLOAT ||
    status === GPSFixType.STATIC
  ) {
    return 'success';
  }

  return 'error';
};

const useStyles = makeStyles(
  (theme) => ({
    root: {
      flexGrow: 1,
      fontFamily: monospacedFont,
      fontSize: 'small',
      fontVariantNumeric: 'lining-nums tabular-nums',
      marginTop: [-2, '!important'],
      marginBottom: [-4, '!important'],
      whiteSpace: 'pre',
    },
    muted: {
      color: theme.palette.text.disabled,
    },
    pill: {
      display: 'inline-block',
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
    },
    batteryIndicator: {
      display: 'inline-block',
      textAlign: 'left',
      margin: theme.spacing(0, 0.5),
      width: 48,
    },
  }),
  { name: 'DroneStatusLine' }
);

/**
 * Status line in the drone list view that represents a single drone.
 */
const DroneStatusLine = ({
  batteryStatus,
  color,
  coordinateFormatter,
  debugString,
  details,
  editing,
  heading,
  headingDeviation,
  id,
  gpsFixType,
  label,
  missing,
  mode,
  position,
  text,
  textSemantics,
}) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      {padStart(label, 4)}
      <span className={classes.muted}>
        {padStart(!editing && id !== label ? id : '', 4)}
      </span>
      {(details || text) && (
        <StatusPill
          inline
          className={clsx(classes.pill, classes.statusPill)}
          status={textSemantics}
        >
          {details || text}
        </StatusPill>
      )}
      {!missing && (
        <>
          <StatusPill
            inline
            className={clsx(classes.pill, classes.modePill)}
            status='off'
          >
            {mode ? abbreviateFlightMode(mode) : '----'}
          </StatusPill>
          <BatteryIndicator
            className={classes.batteryIndicator}
            {...batteryStatus}
          />
          <ColoredLight inline color={color} />
          <StatusPill
            inline
            hollow
            className={clsx(classes.pill, classes.gpsPill)}
            status={gpsFixTypeToStatus(gpsFixType)}
          >
            {abbreviateGPSFixType(gpsFixType)}
          </StatusPill>
          {position ? (
            padEnd(coordinateFormatter([position.lon, position.lat]), 22)
          ) : (
            <span className={classes.muted}>{padEnd('no position', 22)}</span>
          )}
          {padStart(
            !isNil(position && position.amsl) ? Math.round(position.amsl) : '?',
            3
          ) +
            '/' +
            padStart(
              !isNil(position && position.agl) ? Math.round(position.agl) : '?',
              3
            ) +
            'm'}
          <StatusText status={headingDeviationToStatus(headingDeviation)}>
            {padStart(!isNil(heading) ? Math.round(heading) + '\u00B0' : '', 5)}
          </StatusText>
          {debugString ? ' ' + debugString : ''}
        </>
      )}
    </div>
  );
};

DroneStatusLine.propTypes = {
  batteryStatus: PropTypes.shape({
    votlage: PropTypes.number,
    percentage: PropTypes.number,
  }),
  color: PropTypes.string,
  coordinateFormatter: PropTypes.func,
  debugString: PropTypes.string,
  details: PropTypes.string,
  editing: PropTypes.bool,
  gpsFixType: PropTypes.number,
  heading: PropTypes.number,
  headingDeviation: PropTypes.number,
  id: PropTypes.string,
  label: PropTypes.string,
  missing: PropTypes.bool,
  mode: PropTypes.string,
  position: PropTypes.shape({
    lat: PropTypes.number,
    lon: PropTypes.number,
    amsl: PropTypes.number,
    agl: PropTypes.number,
  }),
  text: PropTypes.string,
  textSemantics: PropTypes.oneOf([
    'off',
    'info',
    'success',
    'warning',
    'rth',
    'error',
    'critical',
  ]),
};

DroneStatusLine.defaultProps = {
  textSemantics: 'info',
};

export default connect(
  // mapStateToProps
  () => {
    const statusSummarySelector = createSingleUAVStatusSummarySelector();
    return (state, ownProps) => {
      const uavId = ownProps.id;
      const uav = state.uavs.byId[uavId];
      const headingDeviation = uav
        ? getDeviationFromTakeoffHeadingByUavId(state, uavId)
        : 0;
      const color = uav
        ? getLightColorByUavIdInCSSNotation(state, uavId)
        : 'black';
      return {
        batteryStatus: uav ? uav.battery : undefined,
        color,
        coordinateFormatter: getPreferredCoordinateFormatter(state),
        debugString: uav ? uav.debugString : undefined,
        gpsFixType: uav ? uav.gpsFix.type : undefined,
        heading: uav ? uav.heading : undefined,
        headingDeviation,
        missing: !uav,
        mode: uav ? uav.mode : undefined,
        position: uav ? uav.position : undefined,
        ...statusSummarySelector(state, ownProps.id),
      };
    };
  }
)(DroneStatusLine);
