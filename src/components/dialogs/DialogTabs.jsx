import PropTypes from 'prop-types';
import React from 'react';

import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import { makeStyles } from '@material-ui/core/styles';

import { isDark } from '~/theme';

const useStyles = makeStyles(
  theme => ({
    root: {
      backgroundColor: isDark(theme) ? '#222' : undefined,
      color: isDark(theme) ? theme.palette.getContrastText('#222') : undefined
    }
  }),
  { name: 'DialogTabs' }
);

const DialogTabs = ({ children, ...rest }) => {
  const classes = useStyles();
  return (
    <AppBar position="static" color="primary" className={classes.root}>
      <Tabs centered variant="fullWidth" {...rest}>
        {children}
      </Tabs>
    </AppBar>
  );
};

DialogTabs.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ])
};

export default DialogTabs;
