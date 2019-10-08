import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import MaterialUISwitch from '@material-ui/core/Switch';
import MaterialUITextField from '@material-ui/core/TextField';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';
import PropTypes from 'prop-types';
import React from 'react';
import useToggle from 'react-use-toggle';

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
  meta: PropTypes.any
};

const preventDefault = event => event.preventDefault();

/**
 * Render function for `react-final-form` that binds a `<Field>` component
 * to a Material UI `<TextField>`, configured to be suitable for password
 * entry.
 *
 * @param  {Object} props  props provided by `react-final-form`
 * @return {Object} the rendered Material UI text field component
 */
export const PasswordField = ({ input, meta, ...rest }) => {
  const [passwordIsMasked, togglePasswordMask] = useToggle(true);

  const { name, onChange, value, ...restInput } = input;
  const showError =
    ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) &&
    meta.touched;
  return (
    <MaterialUITextField
      {...rest}
      name={name}
      type={passwordIsMasked ? 'password' : 'text'}
      helperText={showError ? meta.error || meta.submitError : undefined}
      error={showError}
      value={value}
      inputProps={{
        autoComplete: 'current-password',
        ...restInput,
        type: passwordIsMasked ? 'password' : 'text'
      }}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={togglePasswordMask}
              onMouseDown={preventDefault}
            >
              {passwordIsMasked ? <Visibility /> : <VisibilityOff />}
            </IconButton>
          </InputAdornment>
        )
      }}
      onChange={onChange}
    />
  );
};

PasswordField.propTypes = {
  input: PropTypes.any,
  meta: PropTypes.any
};

/**
 * Render function for `react-final-form` that binds a `<Field>` component
 * to a Material UI `<TextField>`.
 *
 * @param  {Object} props  props provided by `react-final-form`
 * @return {Object} the rendered Material UI text field component
 */
export const TextField = ({ input, meta, ...rest }) => {
  const { name, onChange, value, ...restInput } = input;
  const showError =
    ((meta.submitError && !meta.dirtySinceLastSubmit) || meta.error) &&
    meta.touched;
  return (
    <MaterialUITextField
      {...rest}
      name={name}
      helperText={showError ? meta.error || meta.submitError : undefined}
      error={showError}
      inputProps={restInput}
      value={value}
      onChange={onChange}
    />
  );
};

TextField.propTypes = {
  input: PropTypes.any,
  meta: PropTypes.any
};
