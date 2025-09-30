import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import PropTypes from 'prop-types';
import React from 'react';

import CoordinateField from '~/components/CoordinateField';
import RotationField from '~/components/RotationField';

/**
 * Composite component that allows the user to specify the type, origin and
 * orientation of a full flat-Earth coordinate system.
 */
const CoordinateSystemFields = ({
  orientation,
  orientationLabel = 'Orientation (X+ axis)',
  origin,
  originLabel = 'Origin',
  type,
  onOrientationChanged,
  onOriginChanged,
  onTypeChanged,
}) => (
  <Box sx={{ display: 'flex', flexDirection: 'row' }}>
    <FormControl style={{ minWidth: 90 }} variant='filled'>
      <InputLabel htmlFor='coordinate-system-type'>Type</InputLabel>
      <Select
        disabled={!onTypeChanged}
        value={type}
        inputProps={{ id: 'coordinate-system-type' }}
        onChange={onTypeChanged}
      >
        <MenuItem value='neu'>NEU</MenuItem>
        <MenuItem value='nwu'>NWU</MenuItem>
      </Select>
    </FormControl>
    <Box sx={{ p: 1 }} />
    <CoordinateField
      fullWidth
      label={originLabel}
      value={origin}
      variant='filled'
      onChange={onOriginChanged}
    />
    <Box sx={{ p: 1 }} />
    <RotationField
      style={{ minWidth: 160 }}
      label={orientationLabel}
      value={orientation}
      variant='filled'
      onChange={onOrientationChanged}
    />
  </Box>
);

CoordinateSystemFields.propTypes = {
  onOrientationChanged: PropTypes.func,
  onOriginChanged: PropTypes.func,
  onTypeChanged: PropTypes.func,
  orientation: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  orientationLabel: PropTypes.string,
  origin: PropTypes.arrayOf(PropTypes.number),
  originLabel: PropTypes.string,
  type: PropTypes.string.isRequired,
};

export default CoordinateSystemFields;
