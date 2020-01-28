import clsx from 'clsx';
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

const useStyles = makeStyles(theme => ({
  root: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    margin: theme.spacing(1),
    minWidth: theme.spacing(8),
    '& div': {
      marginBottom: theme.spacing(0.5)
    }
  },

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
}));

/**
 * Avatar that represents a single drone.
 */
const DroneAvatar = ({
  batteryStatus,
  crossed,
  id,
  progress,
  secondaryStatus,
  status,
  text,
  textSemantics
}) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <div className={clsx(classes.avatarWrapper, crossed && 'crossed')}>
        <Avatar className={clsx(classes.avatar, classes[`avatar-${status}`])}>
          {id}
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
      <BatteryIndicator {...batteryStatus} />
    </div>
  );
};

DroneAvatar.propTypes = {
  batteryStatus: PropTypes.shape({
    votlage: PropTypes.number,
    percentage: PropTypes.number
  }),
  crossed: PropTypes.bool,
  id: PropTypes.string,
  progress: PropTypes.number,
  secondaryStatus: PropTypes.oneOf([
    'off',
    'success',
    'warning',
    'rth',
    'error',
    'critical'
  ]),
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
  return 'success';
}

export default connect(
  // mapStateToProps
  (state, ownProps) => {
    const uav = state.uavs.byId[ownProps.id];
    return {
      batteryStatus: uav.battery,
      status: getDroneStatus(uav)
    };
  }
)(DroneAvatar);
