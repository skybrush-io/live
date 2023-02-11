import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect, useDispatch, useSelector } from 'react-redux';

import Box from '@material-ui/core/Box';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import Typography from '@material-ui/core/Typography';

import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';

import { formatParameters, parseParameters } from './formatting';
import { shouldRebootAfterParameterUpload } from './selectors';
import { setRebootAfterUpload, updateParametersInManifest } from './slice';

const ParametersTextFieldPresentation = ({ onChange, optimizeUIForTouch }) => {
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
      fullWidth
      multiline
      autoFocus={!optimizeUIForTouch}
      error={Boolean(error)}
      label='Parameter names and values'
      variant='filled'
      minRows={7}
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

ParametersTextFieldPresentation.propTypes = {
  onChange: PropTypes.func,
  optimizeUIForTouch: PropTypes.bool,
};

const ParametersTextField = connect(
  // mapStateToProps
  (state) => ({
    optimizeUIForTouch: shouldOptimizeUIForTouch(state),
  })
)(ParametersTextFieldPresentation);

const ParameterUploadMainPanel = () => {
  const shouldReboot = useSelector(shouldRebootAfterParameterUpload);
  const dispatch = useDispatch();

  const handleManifestChange = ({ value, valid, commit }) => {
    if (valid && commit && value.length > 0) {
      dispatch(updateParametersInManifest(value));
    }
  };

  const handleRebootStateChange = (value, checked) => {
    dispatch(setRebootAfterUpload(checked));
  };

  return (
    <Box pt={1}>
      <ParametersTextField onChange={handleManifestChange} />
      <Box pt={1}>
        <Typography variant='body1'>
          Press <kbd>⇧</kbd> + <kbd>Enter</kbd> to add the parameter to the
          manifest. Click on a parameter in the sidebar to remove it from the
          manifest.
        </Typography>
      </Box>
      <Box pt={1}>
        <FormControlLabel
          style={{ margin: '0' }}
          control={
            <Switch
              checked={shouldReboot}
              color='primary'
              onChange={handleRebootStateChange}
            />
          }
          label='Reboot after upload'
        />
      </Box>
    </Box>
  );
};

export default ParameterUploadMainPanel;
