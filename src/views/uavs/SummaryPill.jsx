import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

import Colors from '~/components/colors';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      backgroundColor: theme.palette.background.paper,
      borderRadius: theme.spacing(1),
      color: theme.palette.getContrastText.primary,
      fontSize: 'small',
      overflow: 'hidden',
      padding: `0 ${theme.spacing(0.5)}`,
      textAlign: 'center',
      textTransform: 'uppercase',
      userSelect: 'none',
      whiteSpace: 'nowrap',
      width: '100%',
    },

    'status-info': {
      backgroundColor: Colors.info,
      color: theme.palette.getContrastText(Colors.info),
    },

    'status-success': {
      backgroundColor: Colors.success,
      color: theme.palette.getContrastText(Colors.success),
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

    '@keyframes flash': {
      '0%, 49%': {
        opacity: 0.5,
      },
      '50%, 100%': {
        opacity: 1,
      },
    },
  }),
  { name: 'SummaryPill' }
);

/**
 * Summary pill that can be placed below the drone avatar to show a single
 * line of additional textual information.
 */
const SummaryPill = ({ children, status }) => {
  const classes = useStyles();
  return (
    <div className={clsx(classes.root, classes[`status-${status}`])}>
      {children}
    </div>
  );
};

SummaryPill.propTypes = {
  children: PropTypes.node,
  status: PropTypes.oneOf([
    'off',
    'info',
    'success',
    'warning',
    'rth',
    'error',
    'critical',
  ]),
};

SummaryPill.defaultProps = {
  status: 'info',
};

export default SummaryPill;
