import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { connect } from 'react-redux';

import TextField from '@material-ui/core/TextField';

import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';

const ParametersTextField = ({
  initialValue,
  onChange,
  optimizeUIForTouch,
}) => {
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
      fullWidth
      multiline
      autoFocus={!optimizeUIForTouch}
      error={Boolean(error)}
      label='Parameter names and values'
      variant='filled'
      minRows={10}
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
  optimizeUIForTouch: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    optimizeUIForTouch: shouldOptimizeUIForTouch(state),
  })
)(ParametersTextField);
