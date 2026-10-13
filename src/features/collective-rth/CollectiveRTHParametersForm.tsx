import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import {
  SimpleDistanceField,
  SimpleDurationField,
  SimpleVelocityField,
} from '~/components/forms/fields';
import type { CollectiveRTHParameters } from '~/flockwave/types';

import Grid from '@mui/material/Grid';
import { selectParameters } from './selectors';
import { areCollectiveRTHParametersValid } from './validation';

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

/**
 * Hook that manages the local state of the collective RTH parameters form.
 *
 * The form is seeded from the default parameters stored in the Redux state
 * (and persisted between application restarts); the current values are
 * written back to the state when the user starts a collective RTH plan
 * calculation.
 */
export function useCollectiveRTHParametersFormState() {
  const defaults = useSelector(selectParameters);

  const [minDistance, setMinDistance] = useState(defaults.minDistance);
  const [timeResolution, setTimeResolution] = useState(defaults.timeResolution);
  const [horizontalVelocity, setHorizontalVelocity] = useState(
    defaults.horizontalVelocity
  );
  const [verticalVelocity, setVerticalVelocity] = useState(
    defaults.verticalVelocity
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
    return areCollectiveRTHParametersValid(parameters);
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

  return (
    <Grid container spacing={2}>
      <Grid size={6}>
        <SimpleDurationField
          fullWidth
          label={t('form.timeResolution.label')}
          min={0}
          max={600}
          value={parameters.timeResolution}
          disabled={disabled}
          helperText={t('form.timeResolution.help')}
          onChange={onTimeResolutionChanged}
        />
      </Grid>
      <Grid size={6}>
        <SimpleDistanceField
          fullWidth
          label={t('form.minDistance.label')}
          min={0.001}
          max={100}
          value={parameters.minDistance}
          disabled={disabled}
          helperText={t('form.minDistance.help')}
          onChange={onMinDistanceChanged}
          size='small'
        />
      </Grid>
      <Grid size={6}>
        <SimpleVelocityField
          fullWidth
          label={t('form.horizontalVelocity.label')}
          min={0.1}
          max={100}
          value={parameters.horizontalVelocity}
          disabled={disabled}
          helperText={t('form.horizontalVelocity.help')}
          onChange={onHorizontalVelocityChanged}
        />
      </Grid>
      <Grid size={6}>
        <SimpleVelocityField
          fullWidth
          label={t('form.verticalVelocity.label')}
          min={0.1}
          max={100}
          value={parameters.verticalVelocity}
          disabled={disabled}
          helperText={t('form.verticalVelocity.help')}
          onChange={onVerticalVelocityChanged}
        />
      </Grid>
    </Grid>
  );
}

export default CollectiveRTHParametersForm;
