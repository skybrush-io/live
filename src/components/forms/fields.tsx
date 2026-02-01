import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import MaterialUISwitch, {
  type SwitchProps as MaterialUISwitchProps,
} from '@mui/material/Switch';
import MaterialUITextField, {
  type TextFieldProps as MaterialUITextFieldProps,
} from '@mui/material/TextField';
import isNil from 'lodash-es/isNil';
import {
  Select as RFFSelect,
  TextField as RFFTextField,
  type SelectProps as RFFSelectProps,
  type TextFieldProps as RFFTextFieldProps,
} from 'mui-rff';
import numbro from 'numbro';
import PropTypes from 'prop-types';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Field,
  type FieldProps,
  type FieldRenderProps,
} from 'react-final-form';
import { useToggle } from 'react-use';

import { formatDurationHMS } from '~/utils/formatting';
import {
  formatCoordinate,
  normalizeAngle,
  parseCoordinate,
} from '~/utils/geography';
import { isCoordinate2D, type Coordinate2D } from '~/utils/math';
import { parseDurationHMS } from '~/utils/parsing';
import { between, finite, join, required } from '~/utils/validation';

/* ************************************************************************* */

const textFieldSlotPropsWithHTMLInputProps = (
  props: RFFTextFieldProps['slotProps'],
  htmlInputProps: React.InputHTMLAttributes<HTMLInputElement>
) => {
  props = props ?? {};
  props.htmlInput = {
    ...(htmlInputProps ?? {}),
    ...(props.htmlInput ?? {}),
  };
  return props;
};

const textFieldSlotPropsWithUnitAdornment = (
  props: RFFTextFieldProps['slotProps'],
  unit: React.ReactNode
) => {
  props = props ?? {};
  props.input = {
    endAdornment: <InputAdornment position='end'>{unit}</InputAdornment>,
    ...(props.input ?? {}),
  };
  return props;
};

/* ************************************************************************* */

type SelectProps = RFFSelectProps &
  Readonly<{
    margin: 'normal' | 'dense';
  }>;

/**
 * Select component that can be placed in a `react-final-form` form and
 * that fits the general application style.
 */
export const Select = ({
  formControlProps,
  margin = 'dense',
  ...rest
}: SelectProps): React.JSX.Element => (
  <RFFSelect
    formControlProps={{
      variant: 'filled',
      margin,
      ...formControlProps,
    }}
    {...rest}
  />
);

/**
 * Text field component that can be placed in a `react-final-form` form and
 * that fits the general application style.
 */
export const TextField = (props: RFFTextFieldProps): React.JSX.Element => (
  <RFFTextField variant='filled' {...props} />
);

type SwitchProps = MaterialUISwitchProps & FieldRenderProps<string>;

/**
 * Render function for `react-final-form` that binds a `<Field>` component
 * to a Material UI `<Switch>`.
 *
 * @param  {Object} props  props provided by `react-final-form`
 * @return {Object} the rendered Material UI switch component
 */
export const Switch = ({
  input,
  meta,
  ...rest
}: SwitchProps): React.JSX.Element => {
  const { checked, name, onChange, ...restInput } = input;
  return (
    <MaterialUISwitch
      {...rest}
      name={name}
      slotProps={{ input: restInput }}
      checked={checked}
      onChange={onChange}
    />
  );
};

const preventDefault = (event: React.SyntheticEvent): void => {
  event.preventDefault();
};

type PasswordFieldFormBindingProps = MaterialUITextFieldProps &
  FieldRenderProps<string>;

/**
 * Render function for `react-final-form` that binds a `<Field>` component
 * to a Material UI `<TextField>`, configured to be suitable for password
 * entry.
 *
 * @param  {Object} props  props provided by `react-final-form`
 * @return {Object} the rendered Material UI text field component
 */
const PasswordFieldFormBinding = ({
  input,
  meta,
  ...rest
}: PasswordFieldFormBindingProps): React.JSX.Element => {
  const [passwordIsMasked, togglePasswordMask] = useToggle(true);

  const { name, onChange, value, ...restInput } = input;
  const showError: boolean =
    ((Boolean(meta.submitError) && !meta.dirtySinceLastSubmit) ||
      Boolean(meta.error)) &&
    Boolean(meta.touched);
  return (
    <MaterialUITextField
      variant='filled'
      {...rest}
      name={name}
      type={passwordIsMasked ? 'password' : 'text'}
      helperText={
        showError ? Boolean(meta.error) || Boolean(meta.submitError) : undefined
      }
      error={showError}
      value={value}
      slotProps={{
        htmlInput: {
          autoComplete: 'current-password',
          ...restInput,
          type: passwordIsMasked ? 'password' : 'text',
        },
        input: {
          endAdornment: (
            <InputAdornment position='end'>
              <IconButton
                aria-label='toggle password visibility'
                size='large'
                onClick={togglePasswordMask}
                onMouseDown={preventDefault}
              >
                {passwordIsMasked ? <Visibility /> : <VisibilityOff />}
              </IconButton>
            </InputAdornment>
          ),
        },
      }}
      onChange={onChange}
    />
  );
};

/**
 * Password field that can be placed in a `react-final-form` form.
 */
export const PasswordField = (props: FieldProps<string>): React.JSX.Element => (
  <Field component={PasswordFieldFormBinding} {...props} />
);

/* ************************************************************************* */

type AngleFieldProps = RFFTextFieldProps;

/**
 * Numeric field that can be placed in a `react-final-form` form to input
 * angles in degrees.
 */
export const AngleField = ({
  slotProps,
  ...rest
}: AngleFieldProps): React.JSX.Element => (
  <TextField
    type='number'
    slotProps={textFieldSlotPropsWithUnitAdornment(slotProps, '°')}
    {...rest}
  />
);

/* ************************************************************************* */

/**
 * Numeric field that can be placed in a `react-final-form` form to input
 * angles normalized to the the range [0°, 360°).
 */
export const HeadingField = ({
  fieldProps,
  slotProps,
  ...rest
}: AngleFieldProps): React.JSX.Element => (
  <AngleField
    fieldProps={{
      format: normalizeAngle,
      formatOnBlur: true,
      // Prevent React Final Form from replacing the empty string with
      // `undefined` to avoid React complaining about changing controlledness.
      parse: (v) => v, // eslint-disable-line @typescript-eslint/no-unsafe-return
      validate: join([required, finite]),
      ...fieldProps,
    }}
    slotProps={textFieldSlotPropsWithHTMLInputProps(slotProps, { step: 0.1 })}
    {...rest}
  />
);

/* ************************************************************************* */

/**
 * Numeric field that can be placed in a `react-final-form` form to input
 * angles in the range [-90°, 90°].
 */

export const LatitudeField = ({
  fieldProps,
  slotProps,
  ...rest
}: AngleFieldProps): React.JSX.Element => (
  <AngleField
    fieldProps={{
      validate: join([required, finite, between(-90, 90)]),
      ...fieldProps,
    }}
    slotProps={textFieldSlotPropsWithHTMLInputProps(slotProps, { step: 0.001 })}
    {...rest}
  />
);

/* ************************************************************************* */

/**
 * Numeric field that can be placed in a `react-final-form` form to input
 * angles in the range [-180°, 180°].
 */

export const LongitudeField = ({
  fieldProps,
  slotProps,
  ...rest
}: AngleFieldProps): React.JSX.Element => (
  <AngleField
    fieldProps={{
      validate: join([required, finite, between(-180, 180)]),
      ...fieldProps,
    }}
    slotProps={textFieldSlotPropsWithHTMLInputProps(slotProps, { step: 0.001 })}
    {...rest}
  />
);

/* ************************************************************************* */

type CoordinateFieldProps = {
  formatter: (coord: Coordinate2D) => string;
} & RFFTextFieldProps;

const createCoordinateFieldProps = (
  formatter: CoordinateFieldProps['formatter']
): Partial<FieldProps<string>> => ({
  formatOnBlur: true,
  format(value: string | Coordinate2D): string {
    const parsedValue = isCoordinate2D(value) ? value : parseCoordinate(value);
    try {
      const formattedValue = (formatter || formatCoordinate)(parsedValue!);
      return formattedValue || String(value);
    } catch {
      return String(value);
    }
  },
  validate(value: string): string | undefined {
    const parsedValue = parseCoordinate(value);
    if (!parsedValue) {
      return 'Invalid coordinate';
    }
  },
});

export const CoordinateField = ({
  formatter,
  ...props
}: CoordinateFieldProps): React.JSX.Element => {
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

type DistanceFieldProps = Readonly<{
  max?: number;
  min?: number;
  step?: number;
  unit?: string;
  value?: number;
}> &
  RFFTextFieldProps;

/**
 * Numeric field that can be placed in a `react-final-form` form and that accepts
 * distances.
 */
export const DistanceField = ({
  slotProps,
  max,
  min = 0,
  step,
  unit = 'm',
  ...rest
}: DistanceFieldProps): React.JSX.Element => (
  <TextField
    type='number'
    slotProps={textFieldSlotPropsWithUnitAdornment(
      textFieldSlotPropsWithHTMLInputProps(slotProps, { max, min, step }),
      unit
    )}
    {...rest}
  />
);

/* ************************************************************************* */

type DurationFieldProps = Readonly<{
  max?: number;
  min?: number;
  step?: number;
}> &
  RFFTextFieldProps;

/**
 * Numeric field that can be placed in a `react-final-form` form and that accepts
 * durations in seconds.
 */
export const DurationField = ({
  slotProps,
  max,
  min = 0,
  step,
  ...rest
}: DurationFieldProps): React.JSX.Element => (
  <TextField
    type='number'
    slotProps={textFieldSlotPropsWithUnitAdornment(
      textFieldSlotPropsWithHTMLInputProps(slotProps, { max, min, step }),
      's'
    )}
    {...rest}
  />
);

/* ************************************************************************* */

const createHMSDurationFieldProps = ({
  min,
  max,
}: {
  min?: number;
  max?: number;
}): Partial<FieldProps<string>> => ({
  formatOnBlur: true,
  format(value: string | number): string {
    const parsedValue =
      typeof value === 'number' ? value : parseDurationHMS(value);
    if (Number.isNaN(parsedValue)) {
      /* probably invalid value */
      return typeof value === 'string' ? value : '';
    } else {
      return formatDurationHMS(parsedValue, { padHours: true });
    }
  },
  validate(value: string): string | undefined {
    const parsedValue = parseDurationHMS(value);
    if (!Number.isFinite(parsedValue)) {
      return 'Invalid duration';
    }

    if (typeof min === 'number' && parsedValue < min) {
      return min === 0 ? 'Duration must be non-negative' : 'Duration too short';
    }

    if (typeof max === 'number' && parsedValue > max) {
      return 'Duration too long';
    }
  },
});

type HMSDurationFieldProps = Readonly<{ min?: number; max?: number }> &
  RFFTextFieldProps;

/**
 * Numeric field that can be placed in a `react-final-form` form and that accepts
 * durations in hours:minutes:seconds format.
 */
export const HMSDurationField = ({
  min,
  max,
  ...props
}: HMSDurationFieldProps): React.JSX.Element => {
  const fieldProps = useMemo(
    () => createHMSDurationFieldProps({ min, max }),
    [min, max]
  );
  return <TextField fieldProps={fieldProps} {...props} />;
};

/* ************************************************************************* */

type NumericFieldProps = MaterialUITextFieldProps &
  Readonly<{
    min?: number;
    max?: number;
    step?: number;
    value: number;
  }>;

type CreateNumericFieldOptions = {
  defaultProps?: Partial<NumericFieldProps>;
  displayName?: string;
  formatOptions?: numbro.Format;
  unit?: string;
};

const createNumericField = ({
  defaultProps = {},
  displayName,
  formatOptions,
  unit,
}: CreateNumericFieldOptions = {}): ((
  props: NumericFieldProps
) => React.JSX.Element) => {
  const inputProps = unit
    ? {
        endAdornment: <InputAdornment position='end'>{unit}</InputAdornment>,
      }
    : undefined;

  formatOptions = {
    mantissa: 3,
    trimMantissa: true,
    ...formatOptions,
  };

  const formatter = (value: number): string =>
    numbro(value).format(formatOptions);
  const parser = (
    displayedValue: string,
    { max, min, step }: { max?: number; min?: number; step?: number } = {}
  ): number => {
    if (displayedValue) {
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
    } else {
      return 0;
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
  }: NumericFieldProps): React.JSX.Element => {
    max ??= defaultProps.max;
    min ??= defaultProps.min;
    step ??= defaultProps.step;
    size ??= defaultProps.size;

    const [displayedValue, setDisplayedValue] = useState(() =>
      formatter(value)
    );

    useEffect(() => {
      setDisplayedValue(formatter(value));
    }, [value]);

    const blurHandler = useCallback(
      (event: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        const parsedValue = parser(String(event.target.value), {
          max,
          min,
          step,
        });
        if (parsedValue !== value && onChange) {
          onChange(event);
          setDisplayedValue(formatter(parsedValue));
        } else {
          setDisplayedValue(formatter(value));
        }

        if (onBlur) {
          onBlur(event);
        }
      },
      [max, min, step, value, onBlur, onChange]
    );

    const changeHandler = useCallback(
      (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setDisplayedValue(String(event.target.value));
      },
      []
    );

    return (
      <MaterialUITextField
        slotProps={{
          input: inputProps,
          htmlInput: {
            size,
            type: 'text',
            inputMode: 'decimal',
            pattern: '[\\-0-9+.,]*',
          },
        }}
        variant='filled'
        value={displayedValue}
        onBlur={blurHandler}
        onChange={changeHandler}
        {...rest}
      />
    );
  };

  if (displayName) {
    NumericField.displayName = displayName;
  }

  return NumericField;
};

// These fields are NOT designed to be used in conjunction with react-final-form;
// they are standalone controlled fields based on Material UI
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
    size: 'small',
  },
});

export const SimpleNumericField = createNumericField({
  displayName: 'SimpleNumericField',
});

export const SimpleVelocityField = createNumericField({
  displayName: 'SimpleVelocityField',
  unit: 'm/s',
  defaultProps: {
    min: 0,
    size: 'small',
  },
});

export const SimpleVoltageField = createNumericField({
  displayName: 'SimpleVoltageField',
  unit: 'V',
  defaultProps: {
    min: 0,
    size: 'small',
  },
});
