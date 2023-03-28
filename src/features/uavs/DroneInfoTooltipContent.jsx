import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import { makeStyles } from '@material-ui/core/styles';

import { BatteryFormatter } from '~/components/battery';
import BatteryIndicator from '~/components/BatteryIndicator';
import StatusPill from '~/components/StatusPill';
import { getBatteryFormatter } from '~/features/settings/selectors';
import {
  abbreviateFlightMode,
  abbreviateGPSFixType,
  getSemanticsForGPSFixType,
} from '~/model/enums';
import { formatCoordinateArray, formatNumberSafely } from '~/utils/formatting';

import { createSingleUAVStatusSummarySelector, getUAVById } from './selectors';

const localCoordinateFormatter = formatCoordinateArray;

const useStyles = makeStyles(
  (theme) => ({
    row: {
      display: 'flex',
      flexDirction: 'row',
      flexWrap: 'no-wrap',
      alignItems: 'baseline',
      margin: theme.spacing(0, -0.5, 0.5, 0),

      '& .muted': {
        color: theme.palette.text.disabled,
      },
    },
    uavIdCell: {
      display: 'inline-block',
      fontWeight: 'bold',
      overflow: 'hidden',
    },
    pill: {
      display: 'inline-block',
      margin: theme.spacing(0, 0.5, 0, 0),
      verticalAlign: 'text-top',
    },
    statusPill: {
      minWidth: 88 + theme.spacing(0.5),
      flex: 1,
    },
    modePill: {
      minWidth: 48,
      flex: 1,
    },
    gpsPill: {
      minWidth: 40,
      flex: 1,
    },
    batteryIndicator: {
      display: 'inline-block',
      flex: 1,
      fontFamily: theme.typography.fontFamily,
      minWidth: 48,
      textAlign: 'left',
      padding: theme.spacing(0, 0.75),
      whiteSpace: 'noWrap',
    },
    altitudeLabel: {
      flex: 1,
      textAlign: 'center',
      whiteSpace: 'noWrap',
      margin: theme.spacing(0, 1, 0, 0),
    },
    numSatellitesLabel: {
      flex: 1,
      textAlign: 'center',
      whiteSpace: 'noWrap',
    },
  }),
  { name: 'DroneInfoTooltipContent' }
);

const dash = '—';
const naText = <span className='muted'>—</span>;

/**
 * Content for a tooltip that can be shown on the map or 3D views next to a
 * drone, displaying the most important details about the status of the drone.
 */
const DroneInfoTooltipContent = ({
  batteryFormatter,
  batteryStatus,
  details,
  gpsFix,
  heading,
  label,
  localPosition,
  mode,
  position,
  text,
  textSemantics,
}) => {
  const classes = useStyles();
  const { type: gpsFixType, numSatellites } = gpsFix || {};
  const hasLocalPosition = localPosition && Array.isArray(localPosition);
  return (
    <>
      <div className={classes.row}>
        <div className={classes.uavIdCell}>{label}</div>
        <div className={classes.batteryIndicator}>
          <BatteryIndicator formatter={batteryFormatter} {...batteryStatus} />
        </div>
        <div>{formatNumberSafely(heading, 1, '°', naText)}</div>
      </div>
      <div className={classes.row}>
        <StatusPill
          inline
          className={clsx(classes.pill, classes.statusPill)}
          status={textSemantics}
        >
          {details || text}
        </StatusPill>
      </div>
      <div className={classes.row}>
        <StatusPill
          inline
          className={clsx(classes.pill, classes.modePill)}
          status='off'
        >
          {mode ? abbreviateFlightMode(mode) : '----'}
        </StatusPill>
        <StatusPill
          inline
          hollow
          className={clsx(classes.pill, classes.gpsPill)}
          status={getSemanticsForGPSFixType(gpsFixType)}
        >
          {gpsFixType ? abbreviateGPSFixType(gpsFixType) : dash}
        </StatusPill>
      </div>
      <div className={classes.row}>
        {hasLocalPosition ? (
          localCoordinateFormatter(localPosition)
        ) : (
          <>
            <div className={classes.altitudeLabel}>
              {formatNumberSafely(position?.ahl, 1, ' m', naText)}
              <span className='muted'>{'\u00A0'}AHL</span>
            </div>
            <div className={classes.numSatellitesLabel}>
              {formatNumberSafely(numSatellites, 0, '', naText)}
              <span className='muted'>{'\u00A0'}sats</span>
            </div>
          </>
        )}
      </div>
    </>
  );
};

DroneInfoTooltipContent.propTypes = {
  batteryFormatter: PropTypes.instanceOf(BatteryFormatter),
  batteryStatus: PropTypes.shape({
    cellCount: PropTypes.number,
    charging: PropTypes.bool,
    voltage: PropTypes.number,
    percentage: PropTypes.number,
  }),
  details: PropTypes.string,
  gpsFix: PropTypes.shape({
    type: PropTypes.number,
    numSatellites: PropTypes.number,
  }),
  heading: PropTypes.number,
  label: PropTypes.string,
  localPosition: PropTypes.arrayOf(PropTypes.number),
  mode: PropTypes.string,
  position: PropTypes.shape({
    ahl: PropTypes.number,
  }),
  text: PropTypes.string,
  textSemantics: PropTypes.string,
};

export default connect(
  // mapStateToProps
  () => {
    const statusSummarySelector = createSingleUAVStatusSummarySelector();
    return (state, ownProps) => {
      const uavId = ownProps.id;
      const uav = getUAVById(state, uavId);
      return {
        batteryFormatter: getBatteryFormatter(state),
        gpsFix: uav?.gpsFix,
        heading: uav?.heading,
        label: uavId,
        localPosition: uav?.localPosition,
        missing: !uav,
        mode: uav?.mode,
        position: uav?.position,
        ...statusSummarySelector(state, ownProps.id),
      };
    };
  }
)(DroneInfoTooltipContent);
