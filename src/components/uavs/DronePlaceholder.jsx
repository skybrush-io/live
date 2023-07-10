import clsx from 'clsx';
import * as color from 'color';
import PropTypes from 'prop-types';
import React from 'react';

import Avatar from '@material-ui/core/Avatar';
import { makeStyles } from '@material-ui/core/styles';

import Colors from '~/components/colors';

const useStyles = makeStyles(
  (theme) => ({
    root: {
      position: 'relative',
      marginBottom: theme.spacing(0.5),
    },

    avatar: {
      backgroundColor: Colors.off,
      color: theme.palette.getContrastText(Colors.off),

      // Alternatively we could use `variant="rounded"` and
      // set the amount through `theme.shape.borderRadius`.
      borderRadius: '25%',
    },

    'avatar-off': {
      opacity: 0.5,
    },

    'avatar-editing': {
      backgroundColor: Colors.info,
      color: theme.palette.getContrastText(Colors.info),
      animation: '$pulse 0.5s infinite',
      animationDirection: 'alternate',
    },

    'avatar-error': {
      backgroundColor: Colors.error,
      boxShadow: `0 0 8px 2px ${Colors.error}`,
      color: theme.palette.getContrastText(Colors.error),
    },

    'avatar-success': {
      backgroundColor: Colors.success,
      color: theme.palette.getContrastText(Colors.success),
    },

    '@keyframes pulse': {
      '0%': {
        boxShadow: `0 0 8px 2px ${color(Colors.info).alpha(0)}`,
      },
      '100%': {
        boxShadow: `0 0 8px 2px ${Colors.info}`,
      },
    },
  }),
  { name: 'DronePlaceholder' }
);

/**
 * Placeholder component that can be used in the UAV list for slots where we
 * don't want to display a drone avatar but want to show a placeholder
 * instead that is of the same size as the avatar.
 */
const DronePlaceholder = ({ editing, label, status }) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Avatar
        className={clsx(
          classes.avatar,
          classes[`avatar-${editing ? 'editing' : status}`]
        )}
      >
        {label}
      </Avatar>
    </div>
  );
};

DronePlaceholder.propTypes = {
  editing: PropTypes.bool,
  label: PropTypes.node,
  status: PropTypes.oneOf(['off', 'editing', 'error', 'success']),
};

DronePlaceholder.defaultProps = {
  status: 'off',
};

export default DronePlaceholder;
