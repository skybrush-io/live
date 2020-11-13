import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import MaterialUISwitch from '@material-ui/core/Switch';
import MaterialUITextField from '@material-ui/core/TextField';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import { Select as RFFSelect, TextField as RFFTextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React, { useMemo } from 'react';
import { Field } from 'react-final-form';
import useToggle from 'react-use-toggle';

import { formatCoordinate, parseCoordinate } from '~/utils/geography';

/**
 * Select component that can be placed in a `react-final-form` form and
 * that fits the general application style.
 */
export const Select = ({ formControlProps, margin, ...rest }) => (
  <RFFSelect
    formControlProps={{
      variant: 'filled',
      margin,
      ...formControlProps,
    }}
    {...rest}
  />
);

Select.propTypes = {
  ...RFFSelect.propTypes,
  margin: PropTypes.oneOf(['normal', 'dense']),
};

Select.defaultProps = {
  margin: 'dense',
};

/**
 * Text field component that can be placed in a `react-final-form` form and
 * that fits the general application style.
 */
export const TextField = (props) => (
  <RFFTextField variant='filled' {...props} />
);

TextField.propTypes = RFFTextField.propTypes;

/**
 * Render function for `react-final-form` that binds a `<Field>` component
 * to a Material UI `<Switch>`.
 *
 * @param  {Object} props  props provided by `react-final-form`
 * @return {Object} the rendered Material UI switch component
 */
export const Switch = ({ input, meta, ...rest }) => {
  const { checked, name, onChange, ...restInput } = input;
  return (
    <MaterialUISwitch
      {...rest}
      name={name}
      inputProps={restInput}
      checked={checked}
      onChange={onChange}
    />
  );
};

Switch.propTypes = {
  input: PropTypes.any,
  meta: PropTypes.any,
};

const preventDefault = (event) => event.preventDefault();

/**
 * Render function for `react-final-form` that binds a `<Field>` component
 * to a Material UI `<TextField>`, configured to be suitable for password
 * entry.
 *
 * @param  {Object} props  props provided by `react-final-form`
 * @return {Object} the rendered Material UI text field component
 */
const PasswordFieldFormBinding = ({ input, meta, ...rest }) => {
  const [passwordIsMasked, togglePasswordMask] = useToggle(true);

  const { name, onChange, value, ...restInput } = input;
  const showError =
    ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) &&
    meta.touched;
  return (
    <MaterialUITextField
      variant='filled'
      {...rest}
      name={name}
      type={passwordIsMasked ? 'password' : 'text'}
      helperText={showError ? meta.error || meta.submitError : undefined}
      error={showError}
      value={value}
      inputProps={{
        autoComplete: 'current-password',
        ...restInput,
        type: passwordIsMasked ? 'password' : 'text',
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position='end'>
            <IconButton
              aria-label='toggle password visibility'
              onClick={togglePasswordMask}
              onMouseDown={preventDefault}
            >
              {passwordIsMasked ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      onChange={onChange}
    />
  );
};

PasswordFieldFormBinding.propTypes = {
  input: PropTypes.any,
  meta: PropTypes.any,
};

/**
 * Password field that can be placed in a `react-final-form` form.
 */
export const PasswordField = (props) => (
  <Field component={PasswordFieldFormBinding} {...props} />
);

/* ************************************************************************* */

/**
 * Numeric field that can be placed in a `react-final-form` form and that accepts
 * angles in the range [0; 360].
 */
export const AngleField = ({ InputProps, ...rest }) => (
  <TextField
    type='number'
    InputProps={{
      endAdornment: <InputAdornment position='end'>degrees</InputAdornment>,
      ...InputProps,
    }}
    {...rest}
  />
);

AngleField.propTypes = {
  InputProps: PropTypes.object,
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  size: PropTypes.number,
  step: PropTypes.number,
  value: PropTypes.number,
};

AngleField.defaultProps = {
  max: 360,
  min: 0,
  step: 0.1,
};

// This is NOT designed to be used in conjunction with react-final-form; it is a
// standalone controlled field based on Material UI
export const SimpleAngleField = ({ max, min, size, step, ...rest }) => (
  <MaterialUITextField
    inputProps={{ max, min, size, step, type: 'number' }}
    variant='filled'
    {...rest}
  />
);

SimpleAngleField.propTypes = {
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  size: PropTypes.number,
  step: PropTypes.number,
  value: PropTypes.number,
};

SimpleAngleField.defaultProps = {
  max: 360,
  min: 0,
  step: 0.1,
};

/* ************************************************************************* */

const createCoordinateFieldProps = (formatter) => ({
  formatOnBlur: true,
  format: (value) => {
    const parsedValue =
      Array.isArray(value) && value.length === 2
        ? value
        : parseCoordinate(value);
    try {
      const formattedValue = (formatter || formatCoordinate)(parsedValue);
      return formattedValue || value;
    } catch {
      return value;
    }
  },
  validate: (value) => {
    const parsedValue = parseCoordinate(value);
    if (!parsedValue) {
      return 'Invalid coordinate';
    }
  },
});

export const CoordinateField = ({ formatter, ...props }) => {
  const coordinateFieldProps = useMemo(
    () => createCoordinateFieldProps(formatter),
    [formatter]
  );
  return <TextField fieldProps={coordinateFieldProps} {...props} />;
};

CoordinateField.propTypes = {
  formatter: PropTypes.func,
};

/* ************************************************************************* */

/**
 * Numeric field that can be placed in a `react-final-form` form and that accepts
 * distances.
 */
export const DistanceField = ({ InputProps, ...rest }) => (
  <TextField
    type='number'
    InputProps={{
      endAdornment: <InputAdornment position='end'>m</InputAdornment>,
      ...InputProps,
    }}
    {...rest}
  />
);

DistanceField.propTypes = {
  InputProps: PropTypes.object,
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  size: PropTypes.number,
  step: PropTypes.number,
  value: PropTypes.number,
};

// This is NOT designed to be used in conjunction with react-final-form; it is a
// standalone controlled field based on Material UI
export const SimpleDistanceField = ({ max, min, size, step, ...rest }) => (
  <MaterialUITextField
    InputProps={{
      endAdornment: <InputAdornment position='end'>m</InputAdornment>,
    }}
    inputProps={{ max, min, size, step, type: 'number' }}
    variant='filled'
    {...rest}
  />
);

SimpleDistanceField.propTypes = {
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  size: PropTypes.number,
  step: PropTypes.number,
  value: PropTypes.number,
};

// This is NOT designed to be used in conjunction with react-final-form; it is a
// standalone controlled field based on Material UI
export const SimpleDurationField = ({ max, min, size, ...rest }) => (
  <MaterialUITextField
    InputProps={{
      endAdornment: <InputAdornment position='end'>seconds</InputAdornment>,
    }}
    inputProps={{ max, min, size, type: 'number' }}
    {...rest}
  />
);

SimpleDurationField.propTypes = {
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  size: PropTypes.number,
  value: PropTypes.number,
};

SimpleDurationField.defaultProps = {
  min: 0,
  size: 4,
};
