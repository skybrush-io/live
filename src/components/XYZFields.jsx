import PropTypes from 'prop-types';
import React from 'react';

import Box from '@material-ui/core/Box';

import { SimpleDistanceField } from './forms/fields';

const DIMS = [0, 1, 2];

/**
 * Composite component that allows the user to specify the type, origin and
 * orientation of a full flat-Earth coordinate system.
 */
const XYZFields = ({ onChange, value }) => {
  const callbacks = DIMS.map((index) => (event) => {
    if (!onChange) {
      return;
    }

    const newCoord = Number.parseFloat(event.target.value);
    if (!Number.isNaN(newCoord)) {
      const newValue = [...value];
      newValue[index] = newCoord;
      onChange(newValue);
    }
  });

  return (
    <Box display='flex' flexDirection='row'>
      <SimpleDistanceField label='X' value={value[0]} onChange={callbacks[0]} />
      <Box p={1} />
      <SimpleDistanceField label='Y' value={value[1]} onChange={callbacks[1]} />
      <Box p={1} />
      <SimpleDistanceField label='Z' value={value[2]} onChange={callbacks[2]} />
    </Box>
  );
};

XYZFields.propTypes = {
  value: PropTypes.arrayOf(PropTypes.number),
  onChange: PropTypes.func,
};

export default XYZFields;
