import MaterialUISwitch from '@material-ui/core/Switch'
import MaterialUITextField from '@material-ui/core/TextField'
import PropTypes from 'prop-types'
import React from 'react'

/**
 * Render function for `react-final-form` that binds a `<Field>` component
 * to a Material UI `<Switch>`.
 *
 * @param  {Object} props  props provided by `react-final-form`
 * @return {Object} the rendered Material UI switch component
 */
export const Switch = ({ input, meta, ...rest }) => {
  const { checked, name, onChange, ...restInput } = input
  return (
    <MaterialUISwitch
      {...rest} name={name} inputProps={restInput} checked={checked}
      onChange={onChange}
    />
  )
}

Switch.propTypes = {
  input: PropTypes.any,
  meta: PropTypes.any
}

/**
 * Render function for `react-final-form` that binds a `<Field>` component
 * to a Material UI `<TextField>`.
 *
 * @param  {Object} props  props provided by `react-final-form`
 * @return {Object} the rendered Material UI text field component
 */
export const TextField = ({ input, meta, ...rest }) => {
  const { name, onChange, value, ...restInput } = input
  const showError = (
    (meta.submitError && !meta.dirtySinceLastSubmit) || meta.error
  ) && meta.touched
  return (
    <MaterialUITextField {...rest}
      name={name}
      helperText={showError ? meta.error || meta.submitError : undefined}
      error={showError}
      inputProps={restInput}
      value={value}
      onChange={onChange}
    />
  )
}

TextField.propTypes = {
  input: PropTypes.any,
  meta: PropTypes.any
}
