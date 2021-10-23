import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import { makeStyles } from '@material-ui/core/styles';

import { Colors, Status } from '@skybrush/app-theme-material-ui';

const useStyles = makeStyles({
  'status-info': {
    color: Colors.info,
  },

  'status-waiting': {
    color: Colors.info,
  },

  'status-next': {
    color: Colors.info,
  },

  'status-success': {
    color: Colors.success,
  },

  'status-skipped': {
    color: Colors.warning,
  },

  'status-warning': {
    color: Colors.warning,
    fontWeight: 'bold',
  },

  'status-rth': {
    animation: '$flash 0.5s infinite',
    animationDirection: 'alternate',
    color: Colors.warning,
    fontWeight: 'bold',
  },

  'status-error': {
    color: Colors.error,
    fontWeight: 'bold',
  },

  'status-critical': {
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
});

const StatusText = ({ children, className, component, status }) => {
  const classes = useStyles();
  return React.createElement(
    component,
    {
      className: clsx(className, status && classes['status-' + status]),
    },
    ...children
  );
};

StatusText.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node),
  ]),
  className: PropTypes.string,
  component: PropTypes.elementType,
  status: PropTypes.oneOf(Object.values(Status)),
};

StatusText.defaultProps = {
  component: 'span',
};

export default StatusText;
