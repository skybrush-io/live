import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';

import Box from '@material-ui/core/Box';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import { formatParameters, parseParameters } from './formatting';
import { updateParametersInManifest } from './slice';

const ParametersTextField = ({ onChange }) => {
  const [parameterString, setParameterString] = useState('');
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    setParameterString(event.target.value);
  };

  const validate = (event) => {
    validateValue(event.target.value);
  };

  const validateValue = (value, commit = false) => {
    let parsedParameters;

    try {
      parsedParameters = parseParameters(value);
    } catch (error) {
      setError(error.message || String(error));
      if (onChange) {
        onChange({ valid: false });
      }

      return false;
    }

    setError('');
    if (onChange) {
      onChange({ value: parsedParameters, valid: true, commit });
      setParameterString(formatParameters(parsedParameters));
    }

    return true;
  };

  const handleKeyPress = (event) => {
    if (event.shiftKey && event.key === 'Enter') {
      if (validateValue(event.target.value, true)) {
        setParameterString('');
      }

      event.preventDefault();
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
      rows={7}
      helperText={
        error || 'Specify entries as name=value, one parameter per row.'
      }
      value={parameterString}
      onBlur={validate}
      onChange={handleChange}
      onKeyPress={handleKeyPress}
    />
  );
};

ParametersTextField.propTypes = {
  onChange: PropTypes.func,
};

const ParameterUploadMainPanel = () => {
  const dispatch = useDispatch();

  const handleChange = ({ value, valid, commit }) => {
    if (valid && commit && value.length > 0) {
      dispatch(updateParametersInManifest(value));
    }
  };

  return (
    <Box pt={1}>
      <ParametersTextField onChange={handleChange} />
      <Box pt={1}>
        <Typography variant='body1'>
          Press <kbd>{'\u21E7'}</kbd> + <kbd>Enter</kbd> to add the parameter to
          the manifest. Click on a parameter in the sidebar to remove it from
          the manifest.
        </Typography>
      </Box>
    </Box>
  );
};

export default ParameterUploadMainPanel;
