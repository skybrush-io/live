import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

import Colors from '~/components/colors';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      position: 'absolute',
      height: theme.spacing(1.5),
      width: theme.spacing(1.5),
      right: -2,
      top: -2,
      backgroundColor: theme.palette.background.paper,
      border: `2px solid ${theme.palette.background.paper}`,
      borderRadius: '50%',
      boxSizing: 'content-box',
    },

    light: {
      position: 'absolute',
      width: '100%',
      height: '100%',
      backgroundColor: theme.palette.background.paper,
      borderRadius: '50%',
      boxSizing: 'content-box',
    },

    'status-off': {
      backgroundColor: Colors.off,
    },

    'status-success': {
      backgroundColor: Colors.success,
    },

    'status-warning': {
      backgroundColor: Colors.warning,
    },

    'status-rth': {
      animation: '$flash 0.5s infinite',
      animationDirection: 'alternate',
      backgroundColor: Colors.warning,
    },

    'status-error': {
      backgroundColor: Colors.error,
      color: 'white',
    },

    'status-critical': {
      animation: '$flash 0.5s infinite',
      animationDirection: 'alternate',
      backgroundColor: Colors.error,
      color: 'white',
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
  { name: 'SecondaryStatusLight' }
);

/**
 * Secondary status light that can be placed in one of the corners of the
 * drone avatar.
 */
const SecondaryStatusLight = ({ status }) => {
  const classes = useStyles();
  return (
    <div className={clsx(classes.root)}>
      <div className={clsx(classes.light, classes[`status-${status}`])} />
    </div>
  );
};

SecondaryStatusLight.propTypes = {
  status: PropTypes.oneOf([
    'off',
    'success',
    'warning',
    'rth',
    'error',
    'critical',
  ]),
};

SecondaryStatusLight.defaultProps = {
  status: 'off',
};

export default SecondaryStatusLight;
