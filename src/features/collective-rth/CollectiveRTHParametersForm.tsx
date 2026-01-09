import FormGroup from '@mui/material/FormGroup';
import type { Theme } from '@mui/material/styles';
import { makeStyles } from '@skybrush/app-theme-mui';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { FormHeader } from '@skybrush/mui-components';

import {
  SimpleDistanceField,
  SimpleDurationField,
  SimpleVelocityField,
} from '~/components/forms/fields';

import type {
  CollectiveRTHParameters,
  OptionalCollectiveRTHParameters,
} from './actions';

const useStyles = makeStyles((theme: Theme) => ({
  formGroup: {
    gap: theme.spacing(2),
    marginTop: theme.spacing(-2),
  },
}));

function areParametersValid(params: CollectiveRTHParameters): boolean {
  return (
    params.minDistance >= 0 &&
    params.timeResolution >= 1 &&
    Number.isInteger(params.timeResolution) &&
    params.horizontalVelocity > 0 &&
    params.verticalVelocity > 0
  );
}

/**
 * Parses a distance (string) as meters, rounded to 3 digits.
 */
function parseDistanceAsMeters(value: string): number {
  return Math.round(Number.parseFloat(value) * 1000) * 0.001;
}

/**
 * Parses a duration (string) as seconds, rounded to an integer.
 */
function parseIntegerDurationAsSeconds(value: string): number {
  return Math.round(Number.parseFloat(value));
}

/**
 * Parses a velocity (string) as meters per second.
 */
function parseVelocityMpS(value: string): number {
  return Number.parseFloat(value);
}

export function useCollectiveRTHParametersFormState(
  defaultParams?: OptionalCollectiveRTHParameters
) {
  const [minDistance, setMinDistance] = useState(
    defaultParams?.minDistance ?? 2
  );
  const [timeResolution, setTimeResolution] = useState(
    defaultParams?.timeResolution ?? 10
  );
  const [horizontalVelocity, setHorizontalVelocity] = useState(
    defaultParams?.horizontalVelocity ?? 5
  );
  const [verticalVelocity, setVerticalVelocity] = useState(
    defaultParams?.verticalVelocity ?? 1.5
  );

  const parameters = useMemo<CollectiveRTHParameters>(() => {
    return {
      minDistance,
      timeResolution,
      horizontalVelocity,
      verticalVelocity,
    };
  }, [minDistance, timeResolution, horizontalVelocity, verticalVelocity]);

  const isValid = useMemo(() => {
    return areParametersValid(parameters);
  }, [parameters]);

  const onMinDistanceChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const minDistance = parseDistanceAsMeters(evt.target.value);
      setMinDistance(minDistance);
    },
    []
  );

  const onTimeResolutionChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const timeResolution = parseIntegerDurationAsSeconds(evt.target.value);
      setTimeResolution(timeResolution);
    },
    []
  );

  const onHorizontalVelocityChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setHorizontalVelocity(parseVelocityMpS(evt.target.value));
    },
    []
  );
  const onVerticalVelocityChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setVerticalVelocity(parseVelocityMpS(evt.target.value));
    },
    []
  );

  return {
    parameters,
    isValid,
    onMinDistanceChanged,
    onTimeResolutionChanged,
    onHorizontalVelocityChanged,
    onVerticalVelocityChanged,
  };
}

type Props = ReturnType<typeof useCollectiveRTHParametersFormState> & {
  disabled?: boolean;
};

function CollectiveRTHParametersForm(props: Props) {
  const {
    disabled,
    parameters,
    onHorizontalVelocityChanged,
    onMinDistanceChanged,
    onTimeResolutionChanged,
    onVerticalVelocityChanged,
  } = props;
  const { t } = useTranslation(undefined, {
    keyPrefix: 'collectiveRTHDialog.parameters',
  });
  const styles = useStyles();

  return (
    <FormGroup className={styles.formGroup}>
      <FormHeader>{t('section.parameters')}</FormHeader>
      <SimpleDurationField
        label={t('form.timeResolution.label')}
        min={0}
        max={600}
        value={parameters.timeResolution}
        disabled={disabled}
        helperText={t('form.timeResolution.help')}
        onChange={onTimeResolutionChanged}
      />
      <SimpleDistanceField
        label={t('form.minDistance.label')}
        min={0.001}
        max={100}
        value={parameters.minDistance}
        disabled={disabled}
        helperText={t('form.minDistance.help')}
        onChange={onMinDistanceChanged}
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
  );
}

export default CollectiveRTHParametersForm;
