import Box from '@material-ui/core/Box';
import FormGroup from '@material-ui/core/FormGroup';
import React, { useCallback, useState } from 'react';

import FormHeader from '@skybrush/mui-components/lib/FormHeader';

import { useTranslation } from 'react-i18next';
import {
  SimpleDistanceField,
  SimpleVelocityField,
} from '~/components/forms/fields';

type Meters = number;
type MetersPerSecond = number;

type TakeoffParameters = {
  altitude: Meters;
  velocity: MetersPerSecond;
};

type RTHParameters = {
  horizontalVelocity: MetersPerSecond;
  verticalVelocity: MetersPerSecond;
};

export type AdaptParameters = {
  minDistance: Meters;
  takeoff: TakeoffParameters;
  rth: RTHParameters;
};

const defaultAdaptParameters: AdaptParameters = {
  minDistance: NaN,
  takeoff: {
    altitude: 5,
    velocity: 1.5,
  },
  rth: {
    horizontalVelocity: NaN,
    verticalVelocity: NaN,
  },
};

/**
 * Returns whether the given adapt parameters are valid.
 */
function adaptParametersValid(parameters: AdaptParameters): boolean {
  return (
    !isNaN(parameters.minDistance) &&
    parameters.minDistance > 0 &&
    !isNaN(parameters.takeoff.altitude) &&
    parameters.takeoff.altitude > 0 &&
    !isNaN(parameters.takeoff.velocity) &&
    parameters.takeoff.velocity > 0 &&
    !isNaN(parameters.rth.horizontalVelocity) &&
    parameters.rth.horizontalVelocity > 0 &&
    !isNaN(parameters.rth.verticalVelocity) &&
    parameters.rth.verticalVelocity > 0
  );
}

/**
 * Parses a distance (string) as meters and returns the result as an integer
 * to avoid rounding issues.
 */
function parseDistanceAsMillimeters(value: string): Meters {
  return Math.round(Number.parseFloat(value));
}

/**
 * Parses a velocity (string) as meters per second.
 */
function parseVelocityMpS(value: string): MetersPerSecond {
  return Number.parseFloat(value);
}

export function useAdaptParametersFormState(
  defaultParameters?: AdaptParameters
) {
  const [parameters, setParameters] = useState(
    defaultParameters ?? defaultAdaptParameters
  );
  const [isValid, setIsValid] = useState(
    adaptParametersValid(defaultParameters ?? defaultAdaptParameters)
  );

  const onMinDistanceChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = parseDistanceAsMillimeters(evt.target.value);
      const newParameters = { ...parameters, minDistance: value };
      setParameters(newParameters);
      setIsValid(adaptParametersValid(newParameters));
    },
    [parameters]
  );
  const onTakeoffAltitudeChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = parseDistanceAsMillimeters(evt.target.value);
      const newParameters = {
        ...parameters,
        takeoff: { ...parameters.takeoff, altitude: value },
      };
      setParameters(newParameters);
      setIsValid(adaptParametersValid(newParameters));
    },
    [parameters]
  );
  const onTakeoffVelocityChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = parseVelocityMpS(evt.target.value);
      const newParameters = {
        ...parameters,
        takeoff: { ...parameters.takeoff, velocity: value },
      };
      setParameters(newParameters);
      setIsValid(adaptParametersValid(newParameters));
    },
    [parameters]
  );
  const onRTHHorizontalVelocityChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = parseVelocityMpS(evt.target.value);
      const newParameters = {
        ...parameters,
        rth: { ...parameters.rth, horizontalVelocity: value },
      };
      setParameters(newParameters);
      setIsValid(adaptParametersValid(newParameters));
    },
    [parameters]
  );
  const onRTHVerticalVelocityChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = parseVelocityMpS(evt.target.value);
      const newParameters = {
        ...parameters,
        rth: { ...parameters.rth, verticalVelocity: value },
      };
      setParameters(newParameters);
      setIsValid(adaptParametersValid(newParameters));
    },
    [parameters]
  );

  return {
    parameters,
    isValid,
    onMinDistanceChanged,
    onTakeoffAltitudeChanged,
    onTakeoffVelocityChanged,
    onRTHHorizontalVelocityChanged,
    onRTHVerticalVelocityChanged,
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
    onTakeoffAltitudeChanged,
    onTakeoffVelocityChanged,
    onRTHHorizontalVelocityChanged,
    onRTHVerticalVelocityChanged,
  } = props;
  const { t } = useTranslation(undefined, {
    keyPrefix: 'siteSurveyDialog.adaptParameters',
  });
  return (
    <Box>
      <FormGroup>
        <FormHeader>{t('section.global')}</FormHeader>
        <SimpleDistanceField
          label={t('form.minDistance')}
          min={0.2}
          max={100}
          value={parameters.minDistance}
          onChange={onMinDistanceChanged}
          disabled={disabled}
        />
      </FormGroup>
      <FormGroup>
        <FormHeader>{t('section.takeoff')}</FormHeader>
        <SimpleDistanceField
          label={t('form.takeoff.altitude')}
          min={1}
          max={100}
          value={parameters.takeoff.altitude}
          onChange={onTakeoffAltitudeChanged}
          disabled={disabled}
        />
        <SimpleVelocityField
          label={t('form.takeoff.velocity')}
          min={0.1}
          max={100}
          value={parameters.takeoff.velocity}
          onChange={onTakeoffVelocityChanged}
          disabled={disabled}
        />
      </FormGroup>
      <FormGroup>
        <FormHeader>{t('section.rth')}</FormHeader>
        <SimpleVelocityField
          label={t('form.rth.horizontalVelocity')}
          min={0.1}
          max={100}
          value={parameters.rth.horizontalVelocity}
          onChange={onRTHHorizontalVelocityChanged}
          disabled={disabled}
        />
        <SimpleVelocityField
          label={t('form.rth.verticalVelocity')}
          min={0.1}
          max={100}
          value={parameters.rth.verticalVelocity}
          onChange={onRTHVerticalVelocityChanged}
          disabled={disabled}
        />
      </FormGroup>
    </Box>
  );
}

export default AdaptParametersForm;
