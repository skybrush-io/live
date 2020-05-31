import PropTypes from 'prop-types';
import React from 'react';

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import ListSubheader from '@material-ui/core/ListSubheader';

const UAVListSubheader = ({ label, onSelect, ...rest }) => (
  <ListSubheader disableSticky flex='0 0 100%'>
    <FormControlLabel
      control={<Checkbox size='small' onChange={onSelect} {...rest} />}
      label={label}
    />
  </ListSubheader>
);

UAVListSubheader.propTypes = {
  label: PropTypes.string,
  onSelect: PropTypes.func,
};

export default UAVListSubheader;
