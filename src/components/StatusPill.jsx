import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

import Colors from '~/components/colors';
import { Status } from './semantics';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      borderRadius: theme.spacing(1),
      color: theme.palette.getContrastText.primary,
      fontSize: 'small',
      overflow: 'hidden',
      padding: `0 ${theme.spacing(0.5)}`,
      textAlign: 'center',
      textTransform: 'uppercase',
      userSelect: 'none',
      whiteSpace: 'nowrap',
    },

    fullWidth: {
      width: '100%',
    },

    'status-info': {
      backgroundColor: Colors.info,
      color: theme.palette.getContrastText(Colors.info),
    },

    'status-waiting': {
      backgroundColor: Colors.info,
      color: theme.palette.getContrastText(Colors.info),
    },

    'status-next': {
      backgroundColor: Colors.info,
      color: theme.palette.getContrastText(Colors.info),
    },

    'status-off': {
      backgroundColor: theme.palette.action.selected,
    },

    'status-success': {
      backgroundColor: Colors.success,
      color: theme.palette.getContrastText(Colors.success),
    },

    'status-skipped': {
      backgroundColor: Colors.warning,
      color: theme.palette.getContrastText(Colors.warning),
    },

    'status-warning': {
      backgroundColor: Colors.warning,
      color: theme.palette.getContrastText(Colors.warning),
      fontWeight: 'bold',
    },

    'status-rth': {
      animation: '$flash 0.5s infinite',
      animationDirection: 'alternate',
      backgroundColor: Colors.warning,
      color: theme.palette.getContrastText(Colors.warning),
      fontWeight: 'bold',
    },

    'status-error': {
      backgroundColor: Colors.error,
      color: theme.palette.getContrastText(Colors.error),
      fontWeight: 'bold',
    },

    'status-critical': {
      animation: '$flash 0.5s infinite',
      animationDirection: 'alternate',
      backgroundColor: Colors.error,
      color: theme.palette.getContrastText(Colors.error),
      fontWeight: 'bold',
    },

    'status-hollow-info': {
      color: Colors.info,
    },

    'status-hollow-waiting': {
      color: Colors.info,
    },

    'status-hollow-next': {
      color: Colors.info,
    },

    'status-hollow-success': {
      color: Colors.success,
    },

    'status-hollow-skipped': {
      color: Colors.warning,
    },

    'status-hollow-warning': {
      color: Colors.warning,
      fontWeight: 'bold',
    },

    'status-hollow-rth': {
      animation: '$flash 0.5s infinite',
      animationDirection: 'alternate',
      color: Colors.warning,
      fontWeight: 'bold',
    },

    'status-hollow-error': {
      color: Colors.error,
      fontWeight: 'bold',
    },

    'status-hollow-critical': {
      animation: '$flash 0.5s infinite',
      animationDirection: 'alternate',
      color: Colors.error,
      fontWeight: 'bold',
    },

    '@keyframes flash': {
      '0%, 49%': {
        opacity: 0.5,
      },
      '50%, 100%': {
        opacity: 1,
      },
    },
  }),
  { name: 'StatusPill' }
);

/**
 * Summary pill that can be placed below the drone avatar to show a single
 * line of additional textual information.
 */
const StatusPill = ({ children, className, inline, hollow, status }) => {
  const classes = useStyles();
  return (
    <div
      className={clsx(
        className,
        classes.root,
        !inline && classes.fullWidth,
        hollow
          ? classes[`status-hollow-${status}`]
          : classes[`status-${status}`]
      )}
    >
      {children}
    </div>
  );
};

StatusPill.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
  hollow: PropTypes.bool,
  inline: PropTypes.bool,
  status: PropTypes.oneOf(Object.values(Status)),
};

StatusPill.defaultProps = {
  status: 'info',
};

export default StatusPill;
