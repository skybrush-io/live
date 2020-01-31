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
      color: theme.palette.getContrastText(Colors.off),
      opacity: 0.5
    }
  }),
  { name: 'DronePlaceholder' }
);

/**
 * Placeholder component that can be used in the UAV list for slots where we
 * don't want to display a drone avatar but want to show a placeholder
 * instead that is of the same size as the avatar.
 */
const DronePlaceholder = ({ label }) => {
  const classes = useStyles();
  return (
    <div className={classes.root}>
      <Avatar className={classes.avatar}>{label}</Avatar>
    </div>
  );
};

DronePlaceholder.propTypes = {
  label: PropTypes.string
};

export default DronePlaceholder;
