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
} from '~/features/site-survey/actions';

const defaultAdaptParameters: ShowAdaptParameters = {
  minDistance: 2,
  altitude: 5,
  horizontalVelocity: 5,
  verticalVelocity: 1.5,
};

/**
 * Returns whether the given adapt parameters are valid.
 */
function adaptParametersValid(parameters: ShowAdaptParameters): boolean {
  return (
    !isNaN(parameters.minDistance) &&
    parameters.minDistance > 0 &&
    !isNaN(parameters.altitude) &&
    parameters.altitude > 0 &&
    !isNaN(parameters.verticalVelocity) &&
    parameters.verticalVelocity > 0 &&
    !isNaN(parameters.horizontalVelocity) &&
    parameters.horizontalVelocity > 0
  );
}

/**
 * Parses a distance (string) as meters and returns the result as an integer
 * to avoid rounding issues.
 */
function parseDistanceAsMillimeters(value: string): number {
  return Math.round(Number.parseFloat(value));
}

/**
 * Parses a velocity (string) as meters per second.
 */
function parseVelocityMpS(value: string): number {
  return Number.parseFloat(value);
}

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
      const value = parseDistanceAsMillimeters(evt.target.value);
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
      const value = parseDistanceAsMillimeters(evt.target.value);
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

type Props = ReturnType<typeof useAdaptParametersFormState> & {
  disabled: boolean;
};

function AdaptParametersForm(props: Props) {
  const {
    disabled,
    parameters,
    onMinDistanceChanged,
    onAltitudeChanged,
    onHorizontalVelocityChanged,
    onVerticalVelocityChanged,
  } = props;
  const { t } = useTranslation(undefined, {
    keyPrefix: 'siteSurveyDialog.adaptParameters',
  });
  return (
    <Box>
      <FormGroup>
        <FormHeader>{t('section.parameters')}</FormHeader>
        <SimpleDistanceField
          label={t('form.minDistance')}
          min={0.1}
          max={100}
          value={parameters.minDistance}
          onChange={onMinDistanceChanged}
          disabled={disabled}
        />
        <SimpleDistanceField
          label={t('form.altitude')}
          min={1}
          max={100}
          value={parameters.altitude}
          onChange={onAltitudeChanged}
          disabled={disabled}
        />
        <SimpleVelocityField
          label={t('form.horizontalVelocity')}
          min={0.1}
          max={100}
          value={parameters.horizontalVelocity}
          onChange={onHorizontalVelocityChanged}
          disabled={disabled}
        />
        <SimpleVelocityField
          label={t('form.verticalVelocity')}
          min={0.1}
          max={100}
          value={parameters.verticalVelocity}
          onChange={onVerticalVelocityChanged}
          disabled={disabled}
        />
      </FormGroup>
    </Box>
  );
}

export default AdaptParametersForm;
