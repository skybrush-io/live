import PropTypes from 'prop-types';
import React from 'react';

import AppBar from '@material-ui/core/AppBar';
import { makeStyles } from '@material-ui/core/styles';

import { isDark } from '~/theme';

const useStyles = makeStyles(
  theme => ({
    root: {
      backgroundColor: isDark(theme) ? '#535353' : undefined,
      color: isDark(theme)
        ? theme.palette.getContrastText('#535353')
        : undefined
    }
  }),
  { name: 'DialogAppBar' }
);

/**
 * App bara styled appropriately to be suitable for presentation in the
 * header of a dialog.
 */
const DialogAppBar = ({ children, ...rest }) => {
  const classes = useStyles();
  return (
    <AppBar
      position="static"
      color="primary"
      className={classes.root}
      {...rest}
    >
      {children}
    </AppBar>
  );
};

DialogAppBar.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default DialogAppBar;
