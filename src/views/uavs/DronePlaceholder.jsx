import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';

import Avatar from '@material-ui/core/Avatar';
import { makeStyles } from '@material-ui/core/styles';

import Colors from '~/components/colors';

const useStyles = makeStyles(
  theme => ({
    root: {
      position: 'relative',
      marginBottom: theme.spacing(0.5)
    },

    avatar: {
      backgroundColor: Colors.off,
      color: theme.palette.getContrastText(Colors.off)
    },

    'avatar-off': {
      opacity: 0.5
    },

    'avatar-error': {
      backgroundColor: Colors.error,
      boxShadow: `0 0 8px 2px ${Colors.error}`,
      color: theme.palette.getContrastText(Colors.error)
    }
  }),
  { name: 'DronePlaceholder' }
);

/**
 * Placeholder component that can be used in the UAV list for slots where we
 * don't want to display a drone avatar but want to show a placeholder
 * instead that is of the same size as the avatar.
 */
const DronePlaceholder = ({ label, status }) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Avatar className={clsx(classes.avatar, classes[`avatar-${status}`])}>
        {label}
      </Avatar>
    </div>
  );
};

DronePlaceholder.propTypes = {
  label: PropTypes.node,
  status: PropTypes.oneOf(['off', 'error'])
};

DronePlaceholder.defaultProps = {
  status: 'off'
};

export default DronePlaceholder;
