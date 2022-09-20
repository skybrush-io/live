import PropTypes from 'prop-types';
import React, { useState } from 'react';

import Box from '@material-ui/core/Box';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';

const ParametersTextField = ({ initialValue, onChange }) => {
  const [currentValue, setCurrentValue] = useState(initialValue || '');
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    setCurrentValue(event.target.value);
  };

  const validate = () => {
    let valid = false;

    try {
      if (currentValue.length > 0) {
        JSON.parse(currentValue);
      }

      valid = true;
    } catch (error) {
      setError(error.message || String(error));
    }

    if (valid) {
      setError('');
    }

    if (onChange) {
      onChange({ value: currentValue, valid });
    }
  };

  return (
    <TextField
      autoFocus
      fullWidth
      multiline
      error={Boolean(error)}
      label='Parameter names and values'
      variant='filled'
      minRows={7}
      helperText={error || 'Specify parameters in JSON format.'}
      value={currentValue}
      onBlur={validate}
      onChange={handleChange}
    />
  );
};

ParametersTextField.propTypes = {
  initialValue: PropTypes.string,
  onChange: PropTypes.func,
};

const MissionPlannerMainPanel = ({ onChange, parameters }) => {
  const handleParametersChange = ({ value, valid }) => {
    if (onChange) {
      if (valid) {
        const parsed = value.length > 0 ? JSON.parse(value) : {};
        onChange(typeof parsed === 'object' ? parsed : null);
      } else {
        onChange(null);
      }
    }
  };

  return (
    <>
      <Box pt={1}>
        <FormControl fullWidth variant='filled'>
          <InputLabel htmlFor='mission-type'>Mission type</InputLabel>
          <Select
            fullWidth
            name='missionType'
            label='Mission type'
            value='powerline'
            inputProps={{ id: 'mission-type' }}
          >
            <MenuItem value='powerline'>Power line inspection</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <Box pt={1}>
        <ParametersTextField
          initialValue={parameters}
          onChange={handleParametersChange}
        />
      </Box>
    </>
  );
};

MissionPlannerMainPanel.propTypes = {
  parameters: PropTypes.string,
  onChange: PropTypes.func,
};

export default MissionPlannerMainPanel;
