import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import Avatar from '@material-ui/core/Avatar';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';

import BatteryIndicator from './BatteryIndicator';
import Colors from '~/components/colors';

const useStyles = makeStyles(theme => ({
  root: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'column',
    margin: theme.spacing(1)
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

  'avatar-ok': {
    backgroundColor: Colors.success
  },

  'avatar-warning': {
    backgroundColor: Colors.warning,
    boxShadow: `0 0 8px 2px ${Colors.warning}`
  },

  'avatar-rth': {
    animation: 'flash 1s infinite',
    backgroundColor: Colors.warning,
    boxShadow: `0 0 8px 2px ${Colors.warning}`
  },

  'avatar-error': {
    backgroundColor: Colors.error,
    boxShadow: `0 0 8px 2px ${Colors.error}`,
    color: 'white'
  },

  'avatar-critical': {
    animation: 'flash 1s infinite',
    backgroundColor: Colors.error,
    boxShadow: `0 0 8px 2px ${Colors.error}`,
    color: 'white'
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
const DroneAvatar = ({ crossed, id, progress, status }) => {
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
      </div>
      <BatteryIndicator voltage="12.3" />
    </div>
  );
};

DroneAvatar.propTypes = {
  crossed: PropTypes.bool,
  id: PropTypes.string,
  progress: PropTypes.number,
  status: PropTypes.oneOf(['off', 'ok', 'warning', 'rth', 'error', 'critical'])
};

DroneAvatar.defaultProps = {
  status: 'off'
};

export default DroneAvatar;
