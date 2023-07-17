import clsx from 'clsx';
import isNil from 'lodash-es/isNil';
import padEnd from 'lodash-es/padEnd';
import padStart from 'lodash-es/padStart';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';

import { monospacedFont } from '@skybrush/app-theme-material-ui';
import StatusText from '@skybrush/mui-components/lib/StatusText';

import { BatteryFormatter } from '~/components/battery';
import BatteryIndicator from '~/components/BatteryIndicator';
import ColoredLight from '~/components/ColoredLight';
import StatusPill from '~/components/StatusPill';
import { getBatteryFormatter } from '~/features/settings/selectors';
import {
  createSingleUAVStatusSummarySelector,
  getDeviationFromTakeoffHeadingByUavId,
  getLightColorByUavIdInCSSNotation,
  getUAVById,
} from '~/features/uavs/selectors';
import {
  abbreviateFlightMode,
  abbreviateGPSFixType,
  getSemanticsForGPSFixType,
} from '~/model/enums';
import { getPreferredCoordinateFormatter } from '~/selectors/formatting';
import { formatCoordinateArray } from '~/utils/formatting';

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
    gone: {
      opacity: 0.7,
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
      fontFamily: theme.typography.fontFamily,
      textAlign: 'left',
      padding: theme.spacing(0, 0.75),
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
  secondaryLabel,
  text,
  textSemantics,
}) => {
  const classes = useStyles();
  const { amsl, ahl, agl } = position || {};
  return (
    <div className={clsx(classes.root, gone && classes.gone)}>
      {padStart(label, 4)}
      <span className={classes.muted}>{padStart(secondaryLabel, 4)}</span>
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
            formatter={batteryFormatter}
            {...batteryStatus}
          />
          <ColoredLight inline color={color} />
          <StatusPill
            inline
            hollow
            className={clsx(classes.pill, classes.gpsPill)}
            status={getSemanticsForGPSFixType(gpsFixType)}
          >
            {abbreviateGPSFixType(gpsFixType)}
          </StatusPill>
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
            <span className={classes.muted}>{'   ———'}</span>
          )}
          {!isNil(agl) ? (
            padStart(position.agl.toFixed(1), 6) + 'm'
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
        ...statusSummarySelector(state, ownProps.id),
      };
    };
  }
)(DroneStatusLine);
