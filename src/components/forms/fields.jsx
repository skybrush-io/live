import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import MaterialUISwitch from '@material-ui/core/Switch';
import MaterialUITextField from '@material-ui/core/TextField';
import Visibility from '@material-ui/icons/Visibility';
import VisibilityOff from '@material-ui/icons/VisibilityOff';

import isNil from 'lodash-es/isNil';
import { Select as RFFSelect, TextField as RFFTextField } from 'mui-rff';
import numbro from 'numbro';
import PropTypes from 'prop-types';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Field } from 'react-final-form';
import { useToggle } from 'react-use';

import { formatDurationHMS } from '~/utils/formatting';
import {
  formatCoordinate,
  normalizeAngle,
  parseCoordinate,
} from '~/utils/geography';
import { parseDurationHMS } from '~/utils/parsing';
import { between, finite, join, required } from '~/utils/validation';

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
 * Numeric field that can be placed in a `react-final-form` form to input
 * angles in degrees.
 */
export const AngleField = ({ InputProps, ...rest }) => (
  <TextField
    type='number'
    InputProps={{
      endAdornment: <InputAdornment position='end'>°</InputAdornment>,
      ...InputProps,
    }}
    {...rest}
  />
);

AngleField.propTypes = {
  InputProps: PropTypes.object,
};

/* ************************************************************************* */

/**
 * Numeric field that can be placed in a `react-final-form` form to input
 * angles normalized to the the range [0°, 360°).
 */

export const HeadingField = ({ fieldProps, inputProps, ...rest }) => (
  <AngleField
    inputProps={{ step: 0.1, ...inputProps }}
    fieldProps={{
      format: normalizeAngle,
      formatOnBlur: true,
      // Prevent React Final Form from replacing the empty string with
      // `undefined` to avoid React complaining about changing controlledness.
      parse: (v) => v,
      validate: join([required, finite]),
      ...fieldProps,
    }}
    {...rest}
  />
);

HeadingField.propTypes = {
  fieldProps: PropTypes.object,
  inputProps: PropTypes.object,
};

/* ************************************************************************* */

/**
 * Numeric field that can be placed in a `react-final-form` form to input
 * angles in the range [-90°, 90°].
 */

export const LatitudeField = ({ fieldProps, inputProps, ...rest }) => (
  <AngleField
    inputProps={{ step: 0.001, ...inputProps }}
    fieldProps={{
      validate: join([required, finite, between(-90, 90)]),
      ...fieldProps,
    }}
    {...rest}
  />
);

LatitudeField.propTypes = {
  fieldProps: PropTypes.object,
  inputProps: PropTypes.object,
};

/* ************************************************************************* */

/**
 * Numeric field that can be placed in a `react-final-form` form to input
 * angles in the range [-180°, 180°].
 */

export const LongitudeField = ({ fieldProps, inputProps, ...rest }) => (
  <AngleField
    inputProps={{ step: 0.001, ...inputProps }}
    fieldProps={{
      validate: join([required, finite, between(-180, 180)]),
      ...fieldProps,
    }}
    {...rest}
  />
);

LongitudeField.propTypes = {
  fieldProps: PropTypes.object,
  inputProps: PropTypes.object,
};

/* ************************************************************************* */

const createCoordinateFieldProps = (formatter) => ({
  formatOnBlur: true,
  format(value) {
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
  validate(value) {
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
export const DistanceField = ({
  InputProps,
  inputProps,
  max,
  min,
  step,
  unit,
  ...rest
}) => (
  <TextField
    type='number'
    inputProps={{ max, min, step, ...inputProps }}
    InputProps={{
      endAdornment: <InputAdornment position='end'>{unit}</InputAdornment>,
      ...InputProps,
    }}
    {...rest}
  />
);

DistanceField.propTypes = {
  InputProps: PropTypes.object,
  inputProps: PropTypes.object,
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  size: PropTypes.string,
  step: PropTypes.number,
  unit: PropTypes.string,
  value: PropTypes.number,
};

DistanceField.defaultProps = {
  min: 0,
  unit: 'm',
};

/* ************************************************************************* */

/**
 * Numeric field that can be placed in a `react-final-form` form and that accepts
 * durations in seconds.
 */
export const DurationField = ({
  InputProps,
  inputProps,
  max,
  min,
  step,
  ...rest
}) => (
  <TextField
    type='number'
    inputProps={{ max, min, step, ...inputProps }}
    InputProps={{
      endAdornment: <InputAdornment position='end'>s</InputAdornment>,
      ...InputProps,
    }}
    {...rest}
  />
);

DurationField.propTypes = {
  InputProps: PropTypes.object,
  inputProps: PropTypes.object,
  max: PropTypes.number,
  min: PropTypes.number,
  onChange: PropTypes.func,
  size: PropTypes.string,
  step: PropTypes.number,
  value: PropTypes.number,
};

DurationField.defaultProps = {
  min: 0,
};

/* ************************************************************************* */

const createHMSDurationFieldProps = ({ min, max }) => ({
  formatOnBlur: true,
  format(value) {
    const parsedValue =
      typeof value === 'number' ? value : parseDurationHMS(value);
    if (Number.isNaN(parsedValue)) {
      /* probably invalid value */
      return typeof value === 'string' ? value : '';
    } else {
      return formatDurationHMS(parsedValue, { padHours: true });
    }
  },
  validate(value) {
    const parsedValue = parseDurationHMS(value);
    if (!Number.isFinite(parsedValue)) {
      return 'Invalid duration';
    }

    if (typeof min === 'number' && value < min) {
      return min === 0 ? 'Duration must be non-negative' : 'Duration too short';
    }

    if (typeof max === 'number' && value > max) {
      return 'Duration too long';
    }
  },
});

/**
 * Numeric field that can be placed in a `react-final-form` form and that accepts
 * durations in hours:minutes:seconds format.
 */
export const HMSDurationField = ({ min, max, ...props }) => {
  const fieldProps = useMemo(
    () => createHMSDurationFieldProps({ min, max }),
    [min, max]
  );
  return <TextField fieldProps={fieldProps} {...props} />;
};

HMSDurationField.propTypes = {
  min: PropTypes.number,
  max: PropTypes.number,
};

/* ************************************************************************* */

const createNumericField = ({
  defaultProps,
  displayName,
  formatOptions,
  unit,
} = {}) => {
  const InputProps = unit
    ? {
        endAdornment: <InputAdornment position='end'>{unit}</InputAdornment>,
      }
    : null;

  formatOptions = {
    mantissa: 3,
    trimMantissa: true,
    ...formatOptions,
  };

  const formatter = (value) => numbro(value).format(formatOptions);
  const parser = (displayedValue, { max, min, step } = {}) => {
    if (!displayedValue) {
      return 0;
    } else {
      let result = Number.parseFloat(displayedValue);
      if (Number.isNaN(result) || !Number.isFinite(result)) {
        result = 0;
      }

      if (!isNil(step)) {
        const refValue = isNil(min) ? 0 : min;
        result = Math.round((result - refValue) / step) * step + refValue;
      }

      if (!isNil(max) && result > max) {
        result = max;
      }

      if (!isNil(min) && result < min) {
        result = min;
      }

      return result;
    }
  };

  /* We do not use type: 'number' because it has severe usability problems; see,
   * e.g., the following URL for a summary:
   *
   * https://technology.blog.gov.uk/2020/02/24/why-the-gov-uk-design-system-team-changed-the-input-type-for-numbers/
   */
  const NumericField = ({
    max,
    min,
    size,
    step,
    value,
    onChange,
    onBlur,
    ...rest
  }) => {
    const [displayedValue, setDisplayedValue] = useState(() =>
      formatter(value)
    );

    useEffect(() => {
      setDisplayedValue(formatter(value));
    }, [value]);

    const blurHandler = useCallback(
      (event, ...args) => {
        const parsedValue = parser(event.target.value, { max, min, step });
        if (parsedValue !== value && onChange) {
          onChange(event, ...args);
          setDisplayedValue(formatter(parsedValue));
        } else {
          setDisplayedValue(formatter(value));
        }

        if (onBlur) {
          onBlur(...args);
        }
      },
      [max, min, step, value, onBlur, onChange]
    );

    const changeHandler = useCallback((event) => {
      setDisplayedValue(event.target.value);
    }, []);

    return (
      <MaterialUITextField
        InputProps={InputProps}
        inputProps={{
          size,
          type: 'text',
          inputMode: 'decimal',
          pattern: '[-0-9+.,]*',
        }}
        variant='filled'
        value={displayedValue}
        onBlur={blurHandler}
        onChange={changeHandler}
        {...rest}
      />
    );
  };

  NumericField.propTypes = {
    max: PropTypes.number,
    min: PropTypes.number,
    onBlur: PropTypes.func,
    onChange: PropTypes.func,
    size: PropTypes.number,
    step: PropTypes.number,
    value: PropTypes.number,
  };

  if (displayName) {
    NumericField.displayName = displayName;
  }

  if (defaultProps) {
    NumericField.defaultProps = defaultProps;
  }

  return NumericField;
};

// These fields are NOT designed to be used in conjunction with react-final-form;
// they are standalone controlled field based on Material UI
export const SimpleAngleField = createNumericField({
  displayName: 'SimpleAngleField',
  defaultProps: {
    max: 360,
    min: 0,
    step: 0.1,
  },
  unit: 'degrees',
});

export const SimpleDistanceField = createNumericField({
  displayName: 'SimpleDistanceField',
  unit: 'm',
});

export const SimpleDurationField = createNumericField({
  displayName: 'SimpleDurationField',
  unit: 'seconds',
  defaultProps: {
    min: 0,
    size: 4,
  },
});

export const SimpleNumericField = createNumericField({
  displayName: 'SimpleNumericField',
});

export const SimpleVoltageField = createNumericField({
  displayName: 'SimpleVoltageField',
  unit: 'V',
  defaultProps: {
    min: 0,
    size: 4,
  },
});
