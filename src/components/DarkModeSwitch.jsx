import DarkModeIcon from '@material-ui/icons/Brightness4';

import PropTypes from 'prop-types';
import React from 'react';

import ToggleButton from '~/components/ToggleButton';

const DarkModeSwitch = ({ onChange, value, ...rest }) => (
  <ToggleButton value='dark' selected={value} onChange={onChange}>
    <DarkModeIcon />
  </ToggleButton>
);

DarkModeSwitch.propTypes = {
  onChange: PropTypes.func,
  value: PropTypes.bool,
};

export default DarkModeSwitch;
