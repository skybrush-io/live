import PropTypes from 'prop-types';
import React from 'react';

import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';

import useDarkMode from '~/hooks/useDarkMode';

const DialogTabs = ({ children, ...rest }) => {
  const darkMode = useDarkMode();
  return (
    <AppBar position="static" color={darkMode ? 'default' : 'primary'}>
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
