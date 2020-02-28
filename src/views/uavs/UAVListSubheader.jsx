import PropTypes from 'prop-types';
import React from 'react';

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import ListSubheader from '@material-ui/core/ListSubheader';

const UAVListSubheader = ({ label, ...rest }) => (
  <ListSubheader disableSticky flex="0 0 100%">
    <FormControlLabel
      control={<Checkbox size="small" {...rest} />}
      label={label}
    />
  </ListSubheader>
);

UAVListSubheader.propTypes = {
  label: PropTypes.string
};

export default UAVListSubheader;
