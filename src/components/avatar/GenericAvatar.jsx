import clsx from 'clsx';
import * as color from 'color';
import PropTypes from 'prop-types';
import React from 'react';

import Avatar from '@material-ui/core/Avatar';
import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';

import Colors from '~/components/colors';
import { Status } from '~/components/semantics';
import BatteryIndicator from '~/components/BatteryIndicator';
import StatusPill from '~/components/StatusPill';
import CustomPropTypes from '~/utils/prop-types';

import SecondaryStatusLight from './SecondaryStatusLight';

const useStyles = makeStyles(
  (theme) => ({
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
        width: '0%',
      },

      '&.crossed::after': {
        left: '-20%',
        width: '140%',
      },
    },

    avatar: {
      border: '1px solid rgba(0, 0, 0, 0.3)',
      color: 'black',
      margin: '0 auto',
    },

    'avatar-off': {
      backgroundColor: Colors.off,
      color: theme.palette.getContrastText(Colors.off),
    },

    'avatar-editing': {
      backgroundColor: Colors.info,
      color: theme.palette.getContrastText(Colors.info),
      animation: '$pulse 0.5s infinite',
      animationDirection: 'alternate',
    },

    'avatar-success': {
      backgroundColor: Colors.success,
      color: theme.palette.getContrastText(Colors.success),
    },

    'avatar-warning': {
      backgroundColor: Colors.warning,
      boxShadow: `0 0 8px 2px ${Colors.warning}`,
      color: theme.palette.getContrastText(Colors.warning),
    },

    'avatar-rth': {
      animation: '$flash 0.5s infinite',
      animationDirection: 'alternate',
      backgroundColor: Colors.warning,
      boxShadow: `0 0 8px 2px ${Colors.warning}`,
      color: theme.palette.getContrastText(Colors.warning),
    },

    'avatar-error': {
      backgroundColor: Colors.error,
      boxShadow: `0 0 8px 2px ${Colors.error}`,
      color: theme.palette.getContrastText(Colors.error),
    },

    'avatar-critical': {
      animation: '$flash 0.5s infinite',
      animationDirection: 'alternate',
      backgroundColor: Colors.error,
      boxShadow: `0 0 8px 2px ${Colors.error}`,
      color: theme.palette.getContrastText(Colors.error),
    },

    gone: {
      opacity: 0.5,
    },

    hint: {
      fontSize: '0.75rem',
      color: theme.palette.text.hint,
      height: theme.spacing(2),
      lineHeight: theme.spacing(2) + 'px',
      position: 'absolute',
      right: theme.spacing(0.5),
      textAlign: 'right',
      top: theme.spacing(0.5),
      whiteSpace: 'nowrap',
    },

    '@keyframes pulse': {
      '0%': {
        boxShadow: `0 0 8px 2px ${color(Colors.info).alpha(0)}`,
      },
      '100%': {
        boxShadow: `0 0 8px 2px ${Colors.info}`,
      },
    },

    '@keyframes flash': {
      '0%, 49%': {
        opacity: 0.2,
      },
      '50%, 100%': {
        opacity: 1,
      },
    },

    progress: {
      position: 'absolute',
      top: -2,
      left: -2,
    },
  }),
  { name: 'GenericAvatar' }
);

/**
 * Avatar that represents a single drone, docking station or some other object
 * in the system that has an ID.
 */
const GenericAvatar = ({
  batterySettings,
  batteryStatus,
  hint,
  crossed,
  details,
  editing,
  gone,
  id,
  label,
  progress,
  secondaryStatus,
  status,
  text,
  textSemantics,
}) => {
  const classes = useStyles();

  if (status === Status.INFO) {
    status = Status.SUCCESS;
  }

  const effectiveHint =
    hint === undefined ? (label === undefined || label === id ? '' : id) : hint;

  return (
    <>
      {effectiveHint && <div className={classes.hint}>{effectiveHint}</div>}
      <div
        className={clsx(
          classes.avatarWrapper,
          crossed && 'crossed',
          gone && classes.gone
        )}
      >
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
            variant='static'
          />
        )}
        {secondaryStatus && <SecondaryStatusLight status={secondaryStatus} />}
      </div>
      {(details || text) && (
        <StatusPill status={textSemantics}>{details || text}</StatusPill>
      )}
      {batteryStatus && (
        <BatteryIndicator settings={batterySettings} {...batteryStatus} />
      )}
    </>
  );
};

GenericAvatar.propTypes = {
  batterySettings: CustomPropTypes.batterySettings,
  batteryStatus: PropTypes.shape({
    cellCount: PropTypes.number,
    voltage: PropTypes.number,
    percentage: PropTypes.number,
  }),
  hint: PropTypes.string,
  crossed: PropTypes.bool,
  details: PropTypes.string,
  editing: PropTypes.bool,
  gone: PropTypes.bool,
  id: PropTypes.string,
  label: PropTypes.string,
  progress: PropTypes.number,
  secondaryStatus: PropTypes.oneOf([
    'off',
    'info',
    'success',
    'warning',
    'rth',
    'error',
    'critical',
  ]),
  selected: PropTypes.bool,
  status: PropTypes.oneOf([
    'off',
    'info',
    'success',
    'warning',
    'rth',
    'error',
    'critical',
  ]),
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

GenericAvatar.defaultProps = {
  status: 'off',
  textSemantics: 'info',
};

export default GenericAvatar;
