import PropTypes from 'prop-types';
import React from 'react';

import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import { makeStyles } from '@material-ui/core/styles';

import useDarkMode from '~/hooks/useDarkMode';

const useStyles = makeStyles(
  theme => ({
    root: {},
    rootDark: {
      backgroundColor: '#222',
      color: theme.palette.getContrastText('#222')
    }
  }),
  { name: 'DialogTabs' }
);

const DialogTabs = ({ children, ...rest }) => {
  const darkMode = useDarkMode();
  const classes = useStyles();
  return (
    <AppBar
      position="static"
      color="primary"
      className={darkMode ? classes.rootDark : classes.root}
    >
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
