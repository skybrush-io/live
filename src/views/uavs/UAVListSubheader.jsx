import PropTypes from 'prop-types';
import React from 'react';

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import ListSubheader from '@material-ui/core/ListSubheader';

const UAVListSubheader = ({
  checked,
  indeterminate,
  label,
  onChange,
  value
}) => (
  <ListSubheader disableSticky flex="0 0 100%">
    <FormControlLabel
      control={
        <Checkbox
          checked={checked}
          indeterminate={indeterminate}
          size="small"
          value={value}
          onChange={onChange}
        />
      }
      label={label}
    />
  </ListSubheader>
);

UAVListSubheader.propTypes = {
  checked: PropTypes.bool,
  indeterminate: PropTypes.bool,
  label: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.string
};

export default UAVListSubheader;
