import { makeStyles } from '@material-ui/core';
import Box from '@material-ui/core/Box';
import FormGroup from '@material-ui/core/FormGroup';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import FormHeader from '@skybrush/mui-components/lib/FormHeader';

import {
  SimpleDistanceField,
  SimpleVelocityField,
} from '~/components/forms/fields';

import type {
  OptionalShowAdaptParameters,
  ShowAdaptParameters,
} from './actions';

const defaultAdaptParameters: ShowAdaptParameters = {
  minDistance: 2,
  altitude: 5,
  horizontalVelocity: 5,
  verticalVelocity: 1.5,
};

const useStyles = makeStyles((theme) => ({
  formGroup: {
    gap: theme.spacing(2),
    marginTop: theme.spacing(-2),
  },
}));

/**
 * Returns whether the given adapt parameters are valid.
 */
function adaptParametersValid(parameters: ShowAdaptParameters): boolean {
  // No need to check for NaN because NaN > 0 is always false.
  return (
    parameters.minDistance > 0 &&
    parameters.altitude > 0 &&
    parameters.verticalVelocity > 0 &&
    parameters.horizontalVelocity > 0
  );
}

/**
 * Parses a distance (string) as meters, rounded to 3 digits.
 */
function parseDistanceAsMeters(value: string): number {
  return Math.round(Number.parseFloat(value) * 1000) * 0.001;
}

/**
 * Parses a velocity (string) as meters per second.
 */
function parseVelocityMpS(value: string): number {
  return Number.parseFloat(value);
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function useAdaptParametersFormState(
  defaultParameters?: OptionalShowAdaptParameters,
  onChange?: () => void
) {
  const [parameters, setParameters] = useState<ShowAdaptParameters>({
    altitude: defaultParameters?.altitude ?? defaultAdaptParameters.altitude,
    minDistance:
      defaultParameters?.minDistance ?? defaultAdaptParameters.minDistance,
    horizontalVelocity:
      defaultParameters?.horizontalVelocity ??
      defaultAdaptParameters.horizontalVelocity,
    verticalVelocity:
      defaultParameters?.verticalVelocity ??
      defaultAdaptParameters.verticalVelocity,
  });
  const [isValid, setIsValid] = useState(adaptParametersValid(parameters));

  const onMinDistanceChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = parseDistanceAsMeters(evt.target.value);
      const newParameters: ShowAdaptParameters = {
        ...parameters,
        minDistance: value,
      };
      setParameters(newParameters);
      setIsValid(adaptParametersValid(newParameters));
      onChange?.();
    },
    [onChange, parameters]
  );
  const onAltitudeChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = parseDistanceAsMeters(evt.target.value);
      const newParameters: ShowAdaptParameters = {
        ...parameters,
        altitude: value,
      };
      setParameters(newParameters);
      setIsValid(adaptParametersValid(newParameters));
      onChange?.();
    },
    [onChange, parameters]
  );
  const onHorizontalVelocityChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = parseVelocityMpS(evt.target.value);
      const newParameters: ShowAdaptParameters = {
        ...parameters,
        horizontalVelocity: value,
      };
      setParameters(newParameters);
      setIsValid(adaptParametersValid(newParameters));
      onChange?.();
    },
    [onChange, parameters]
  );
  const onVerticalVelocityChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = parseVelocityMpS(evt.target.value);
      const newParameters: ShowAdaptParameters = {
        ...parameters,
        verticalVelocity: value,
      };
      setParameters(newParameters);
      setIsValid(adaptParametersValid(newParameters));
      onChange?.();
    },
    [onChange, parameters]
  );

  return {
    parameters,
    isValid,
    onMinDistanceChanged,
    onAltitudeChanged,
    onHorizontalVelocityChanged,
    onVerticalVelocityChanged,
  };
}

type Props = Readonly<
  ReturnType<typeof useAdaptParametersFormState> & {
    disabled: boolean;
  }
>;

const AdaptParametersForm = (props: Props): JSX.Element => {
  const {
    disabled,
    parameters,
    onMinDistanceChanged,
    onAltitudeChanged,
    onHorizontalVelocityChanged,
    onVerticalVelocityChanged,
  } = props;
  const { t } = useTranslation(undefined, {
    keyPrefix: 'showConfiguratorDialog.adaptParameters',
  });
  const styles = useStyles();
  return (
    <Box>
      <FormGroup className={styles.formGroup}>
        <FormHeader>{t('section.parameters')}</FormHeader>
        <SimpleDistanceField
          label={t('form.minDistance.label')}
          min={0.1}
          max={100}
          value={parameters.minDistance}
          disabled={disabled}
          helperText={t('form.minDistance.help')}
          onChange={onMinDistanceChanged}
        />
        <SimpleDistanceField
          label={t('form.altitude.label')}
          min={1}
          max={100}
          value={parameters.altitude}
          disabled={disabled}
          helperText={t('form.altitude.help')}
          onChange={onAltitudeChanged}
        />
        <SimpleVelocityField
          label={t('form.horizontalVelocity.label')}
          min={0.1}
          max={100}
          value={parameters.horizontalVelocity}
          disabled={disabled}
          helperText={t('form.horizontalVelocity.help')}
          onChange={onHorizontalVelocityChanged}
        />
        <SimpleVelocityField
          label={t('form.verticalVelocity.label')}
          min={0.1}
          max={100}
          value={parameters.verticalVelocity}
          disabled={disabled}
          helperText={t('form.verticalVelocity.help')}
          onChange={onVerticalVelocityChanged}
        />
      </FormGroup>
    </Box>
  );
};

export default AdaptParametersForm;
