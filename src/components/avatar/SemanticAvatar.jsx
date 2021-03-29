import clsx from 'clsx';
import * as color from 'color';
import PropTypes from 'prop-types';
import React from 'react';

import Avatar from '@material-ui/core/Avatar';
import { makeStyles } from '@material-ui/core/styles';
import {
  colorForStatus,
  Colors,
  Status,
} from '@skybrush/app-theme-material-ui';

const createStyleForStatus = (status, theme, { shadow } = {}) => {
  const color = colorForStatus(status);
  const result = {
    backgroundColor: colorForStatus(status),
    color: theme.palette.getContrastText(color),
  };
  if (shadow) {
    result.boxShadow = `0 0 8px 2px ${color}`;
  }

  return result;
};

const useStyles = makeStyles(
  (theme) => ({
    avatar: {
      border: '1px solid rgba(0, 0, 0, 0.3)',
      color: 'black',
      margin: '0 auto',
    },

    'avatar-critical': {
      ...createStyleForStatus(Status.CRITICAL, theme, { shadow: true }),
      animation: '$flash 0.5s infinite',
      animationDirection: 'alternate',
    },
    'avatar-error': createStyleForStatus(Status.ERROR, theme, { shadow: true }),
    'avatar-info': createStyleForStatus(Status.INFO, theme),
    'avatar-next': {
      ...createStyleForStatus(Status.NEXT, theme),
      animation: '$pulse 0.5s infinite',
      animationDirection: 'alternate',
    },
    'avatar-off': createStyleForStatus(Status.OFF, theme),
    'avatar-rth': {
      ...createStyleForStatus(Status.WARNING, theme, { shadow: true }),
      animation: '$flash 0.5s infinite',
      animationDirection: 'alternate',
    },
    'avatar-skipped': createStyleForStatus(Status.SKIPPED, theme),
    'avatar-success': createStyleForStatus(Status.SUCCESS, theme),
    'avatar-waiting': createStyleForStatus(Status.WAITING, theme),
    'avatar-warning': createStyleForStatus(Status.WARNING, theme, {
      shadow: true,
    }),
    'avatar-missing': createStyleForStatus(Status.MISSING, theme),

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
  }),
  { name: 'SemanticAvatar' }
);

/**
 * Avatar that represents a single drone, docking station or some other object
 * in the system that has an ID.
 */
const SemanticAvatar = ({ children, status }) => {
  const classes = useStyles();
  return (
    <Avatar className={clsx(classes.avatar, classes[`avatar-${status}`])}>
      {children}
    </Avatar>
  );
};

SemanticAvatar.propTypes = {
  children: PropTypes.node,
  status: PropTypes.oneOf(Object.values(Status)),
};

SemanticAvatar.defaultProps = {
  status: Status.OFF,
};

export default SemanticAvatar;
