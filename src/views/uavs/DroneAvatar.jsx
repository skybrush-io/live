import clsx from 'clsx';
import * as color from 'color';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Avatar from '@material-ui/core/Avatar';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';

import BatteryIndicator from './BatteryIndicator';
import SecondaryStatusLight from './SecondaryStatusLight';
import SummaryPill from './SummaryPill';

import Colors from '~/components/colors';
import {
  abbreviateError,
  getSeverityOfErrorCode,
  getSeverityOfMostSevereErrorCode,
  Severity
} from '~/flockwave/errors';

const useStyles = makeStyles(
  theme => ({
    avatarWrapper: {
      position: 'relative',
      marginBottom: theme.spacing(0.5),

      '&::after': {
        background: Colors.error,
        boxShadow:
          '1px 1px 4px rgba(0, 0, 0, 0.6), 1px 1px 2px rgba(255, 255, 255, 0.3) inset',
        content: '""',
        height: 4,
        left: '50%',
        position: 'absolute',
        top: 'calc(50% - 2px)',
        transform: 'rotate(-45deg)',
        transition: 'left 300ms, width 300ms',
        width: '0%'
      },

      '&.crossed::after': {
        left: '-20%',
        width: '140%'
      }
    },

    avatar: {
      border: '1px solid rgba(0, 0, 0, 0.3)',
      color: 'black'
    },

    'avatar-off': {
      backgroundColor: Colors.off,
      color: theme.palette.getContrastText(Colors.off)
    },

    'avatar-editing': {
      backgroundColor: Colors.info,
      color: theme.palette.getContrastText(Colors.info),
      animation: '$pulse 0.5s infinite',
      animationDirection: 'alternate'
    },

    'avatar-success': {
      backgroundColor: Colors.success,
      color: theme.palette.getContrastText(Colors.success)
    },

    'avatar-warning': {
      backgroundColor: Colors.warning,
      boxShadow: `0 0 8px 2px ${Colors.warning}`,
      color: theme.palette.getContrastText(Colors.warning)
    },

    'avatar-rth': {
      animation: '$flash 0.5s infinite',
      animationDirection: 'alternate',
      backgroundColor: Colors.warning,
      boxShadow: `0 0 8px 2px ${Colors.warning}`,
      color: theme.palette.getContrastText(Colors.warning)
    },

    'avatar-error': {
      backgroundColor: Colors.error,
      boxShadow: `0 0 8px 2px ${Colors.error}`,
      color: theme.palette.getContrastText(Colors.error)
    },

    'avatar-critical': {
      animation: '$flash 0.5s infinite',
      animationDirection: 'alternate',
      backgroundColor: Colors.error,
      boxShadow: `0 0 8px 2px ${Colors.error}`,
      color: theme.palette.getContrastText(Colors.error)
    },

    '@keyframes pulse': {
      '0%': {
        boxShadow: `0 0 8px 2px ${color(Colors.info).alpha(0)}`
      },
      '100%': {
        boxShadow: `0 0 8px 2px ${Colors.info}`
      }
    },

    '@keyframes flash': {
      '0%, 49%': {
        opacity: 0.2
      },
      '50%, 100%': {
        opacity: 1
      }
    },

    progress: {
      position: 'absolute',
      top: -2,
      left: -2
    }
  }),
  { name: 'DroneAvatar' }
);

/**
 * Avatar that represents a single drone.
 */
const DroneAvatar = ({
  batteryStatus,
  crossed,
  editing,
  id,
  label,
  progress,
  secondaryStatus,
  status,
  text,
  textSemantics
}) => {
  const classes = useStyles();
  return (
    <>
      <div className={clsx(classes.avatarWrapper, crossed && 'crossed')}>
        <Avatar
          className={clsx(
            classes.avatar,
            classes[`avatar-${editing ? 'editing' : status}`]
          )}
        >
          {label === undefined ? id : label}
        </Avatar>
        {progress > 0 && (
          <CircularProgress
            className={classes.progress}
            size={44}
            value={progress}
            variant="static"
          />
        )}
        {secondaryStatus && <SecondaryStatusLight status={secondaryStatus} />}
      </div>
      {text && <SummaryPill status={textSemantics}>{text}</SummaryPill>}
      {batteryStatus && <BatteryIndicator {...batteryStatus} />}
    </>
  );
};

DroneAvatar.propTypes = {
  batteryStatus: PropTypes.shape({
    votlage: PropTypes.number,
    percentage: PropTypes.number
  }),
  crossed: PropTypes.bool,
  editing: PropTypes.bool,
  id: PropTypes.string,
  label: PropTypes.string,
  progress: PropTypes.number,
  secondaryStatus: PropTypes.oneOf([
    'off',
    'success',
    'warning',
    'rth',
    'error',
    'critical'
  ]),
  selected: PropTypes.bool,
  status: PropTypes.oneOf([
    'off',
    'success',
    'warning',
    'rth',
    'error',
    'critical'
  ]),
  text: PropTypes.string,
  textSemantics: PropTypes.oneOf([
    'off',
    'info',
    'success',
    'warning',
    'rth',
    'error',
    'critical'
  ])
};

DroneAvatar.defaultProps = {
  status: 'off',
  textSemantics: 'info'
};

function severityToSemantics(severity) {
  switch (severity) {
    case Severity.FATAL:
      return 'critical';
    case Severity.ERROR:
      return 'error';
    case Severity.WARNING:
      return 'warning';
    case Severity.INFO:
      return 'info';
    default:
      return 'off';
  }
}

/**
 * Function that takes a drone object from the Redux store and derives the
 * generic status summary of the drone.
 *
 * The rules are as follows (the first matching rule wins);
 *
 * - If the drone has at least one error code where `(errorCode & 0xFF) >> 6`
 *   is 3, the status is "critical".
 *
 * - If the drone has at least one error code where `(errorCode & 0xFF) >> 6`
 *   is 2, the status is "error".
 *
 * - If the drone has at least one error code where `(errorCode & 0xFF) >> 6`
 *   is 1, the status is "warning".
 *
 * - If no status updates were received from the drone since a predefined
 *   longer time frame (say, 60 seconds), the status is "off" and the secondary
 *   status display will read "GONE".
 *
 * - If no status updates were received from the drone since a predefined time
 *   frame, the status is "warning". You can distinguish this from warnings
 *   derived from error codes by looking at the secondary status display,
 *   which should read "AWAY".
 *
 * - If the drone is still initializing or running prearm checks, the status
 *   is "warning". You can distinguish this from warnings derived from error
 *   codes by looking at the secondary status display, which should read "INIT"
 *   or "PREARM".
 *
 * - Otherwise, the status is "success".
 */
function getDroneStatus(uav) {
  if (uav.errors && uav.errors.length > 0) {
    const severity = getSeverityOfMostSevereErrorCode(uav.errors);
    if (severity >= Severity.WARNING) {
      return severityToSemantics(severity);
    }
  }

  // TODO: check expiry dates

  return 'success';
}

function getDroneText(uav) {
  let text;
  let textSemantics;

  if (!uav) {
    text = 'missing';
    textSemantics = 'error';
  } else if (uav.errors && uav.errors.length > 0) {
    const maxError = Math.max(...uav.errors);
    const severity = getSeverityOfErrorCode(maxError);

    text = abbreviateError(maxError);

    if (maxError === 1) {
      // disarm is treated separately; it is always shown as an error
      textSemantics = 'error';
    } else {
      textSemantics = severityToSemantics(severity);
    }
  } else {
    text = 'ready';
    textSemantics = 'success';
  }

  return { text, textSemantics };
}

export default connect(
  // mapStateToProps
  (state, ownProps) => {
    const uav = state.uavs.byId[ownProps.id];
    return uav === undefined
      ? {
          ...getDroneText(uav)
        }
      : {
          batteryStatus: uav.battery,
          status: getDroneStatus(uav),
          ...getDroneText(uav)
        };
  }
)(DroneAvatar);
