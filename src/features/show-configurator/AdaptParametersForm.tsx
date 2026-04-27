import ExpandMore from '@mui/icons-material/ExpandMore';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { makeStyles } from '@skybrush/app-theme-mui';

import {
  SimpleDistanceField,
  SimpleDurationField,
  SimpleVelocityField,
} from '~/components/forms/fields';

import {
  RETURN_TO_HOME_METHODS,
  TAKEOFF_METHODS,
  type OptionalShowAdaptParameters,
  type ReturnToHomeMethodType,
  type ShowAdaptParameters,
  type TakeoffMethodType,
} from './actions';
import LightConfigurationForm, {
  type LightConfigurationProps,
} from './LightConfigurationForm';

const defaultAdaptParameters: ShowAdaptParameters = {
  minDistance: 2,
  altitude: 5,
  altitudeOffset: 0,
  horizontalVelocity: 5,
  verticalVelocity: 1.5,
  takeoffDuration: 0,
  takeoffMethod: 'layered',
  returnToHomeMethod: 'smart',
};

const useStyles = makeStyles((theme) => ({
  accordionDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    '& .react-colorful': {
      height: '120px',
      width: '100%',
    },
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
    parameters.altitudeOffset >= -100 &&
    parameters.altitudeOffset <= 100 &&
    parameters.verticalVelocity > 0 &&
    parameters.horizontalVelocity > 0 &&
    parameters.takeoffDuration >= 0
  );
}

/**
 * Parses a distance (string) as meters, rounded to 3 digits.
 */
function parseDistanceAsMeters(value: string): number {
  return Math.round(Number.parseFloat(value) * 1000) * 0.001;
}

/**
 * Parses a duration (string) as seconds, rounded to 3 digits.
 */
function parseDurationAsSeconds(value: string): number {
  return Math.round(Number.parseFloat(value) * 1000) * 0.001;
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
    altitudeOffset:
      defaultParameters?.altitudeOffset ??
      defaultAdaptParameters.altitudeOffset,
    minDistance:
      defaultParameters?.minDistance ?? defaultAdaptParameters.minDistance,
    horizontalVelocity:
      defaultParameters?.horizontalVelocity ??
      defaultAdaptParameters.horizontalVelocity,
    verticalVelocity:
      defaultParameters?.verticalVelocity ??
      defaultAdaptParameters.verticalVelocity,
    takeoffDuration:
      defaultParameters?.takeoffDuration ??
      defaultAdaptParameters.takeoffDuration,
    takeoffMethod:
      defaultParameters?.takeoffMethod ?? defaultAdaptParameters.takeoffMethod,
    returnToHomeMethod:
      defaultParameters?.returnToHomeMethod ??
      defaultAdaptParameters.returnToHomeMethod,
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
  const onAltitudeOffsetChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = parseDistanceAsMeters(evt.target.value);
      const newParameters: ShowAdaptParameters = {
        ...parameters,
        altitudeOffset: value,
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
  const onTakeoffDurationChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = parseDurationAsSeconds(evt.target.value);
      const newParameters: ShowAdaptParameters = {
        ...parameters,
        takeoffDuration: value,
      };
      setParameters(newParameters);
      setIsValid(adaptParametersValid(newParameters));
      onChange?.();
    },
    [onChange, parameters]
  );
  const onTakeoffMethodChanged = useCallback(
    (event: SelectChangeEvent) => {
      const value: TakeoffMethodType = TAKEOFF_METHODS.includes(
        event.target.value as TakeoffMethodType
      )
        ? (event.target.value as TakeoffMethodType)
        : 'layered';
      const newParameters: ShowAdaptParameters = {
        ...parameters,
        takeoffMethod: value,
      };
      setParameters(newParameters);
      setIsValid(adaptParametersValid(newParameters));
      onChange?.();
    },
    [onChange, parameters]
  );
  const onReturnToHomeMethodChanged = useCallback(
    (
      event:
        | React.ChangeEvent<{ value: string }>
        | { target: { value: string } }
    ) => {
      const value: ReturnToHomeMethodType = RETURN_TO_HOME_METHODS.includes(
        event.target.value as ReturnToHomeMethodType
      )
        ? (event.target.value as ReturnToHomeMethodType)
        : 'smart';
      const newParameters: ShowAdaptParameters = {
        ...parameters,
        returnToHomeMethod: value,
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
    onAltitudeOffsetChanged,
    onHorizontalVelocityChanged,
    onVerticalVelocityChanged,
    onTakeoffDurationChanged,
    onTakeoffMethodChanged,
    onReturnToHomeMethodChanged,
  };
}

type Props = Readonly<
  ReturnType<typeof useAdaptParametersFormState> & {
    disabled: boolean;
  } & { lights: LightConfigurationProps }
>;

const AdaptParametersForm = (props: Props): React.JSX.Element => {
  const {
    disabled,
    lights,
    parameters,
    onMinDistanceChanged,
    onAltitudeChanged,
    onAltitudeOffsetChanged,
    onHorizontalVelocityChanged,
    onVerticalVelocityChanged,
    onTakeoffDurationChanged,
    onTakeoffMethodChanged,
    onReturnToHomeMethodChanged,
  } = props;
  const { t } = useTranslation(undefined, {
    keyPrefix: 'showConfiguratorDialog.adaptParameters',
  });
  const styles = useStyles();
  const [shownSection, setShownSection] = useState<
    'none' | 'safety' | 'trajectories' | 'lights'
  >('safety');
  return (
    <Box>
      <FormGroup>
        <Accordion
          expanded={shownSection === 'safety'}
          style={{ margin: 0 }}
          onChange={() => {
            setShownSection(shownSection === 'safety' ? 'none' : 'safety');
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            {t('panel.safety')}
          </AccordionSummary>
          <AccordionDetails className={styles.accordionDetails}>
            <SimpleDistanceField
              label={t('form.minDistance.label')}
              min={0.1}
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
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={shownSection === 'trajectories'}
          style={{ margin: 0 }}
          onChange={() => {
            setShownSection(
              shownSection === 'trajectories' ? 'none' : 'trajectories'
            );
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            {t('panel.trajectories')}
          </AccordionSummary>
          <AccordionDetails className={styles.accordionDetails}>
            <SimpleDistanceField
              label={t('form.altitudeOffset.label')}
              min={-100}
              max={100}
              value={parameters.altitudeOffset}
              disabled={disabled}
              helperText={t('form.altitudeOffset.help')}
              onChange={onAltitudeOffsetChanged}
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
            <SimpleDurationField
              label={t('form.takeoffDuration.label')}
              min={0}
              max={300}
              value={parameters.takeoffDuration}
              disabled={disabled}
              helperText={t('form.takeoffDuration.help')}
              onChange={onTakeoffDurationChanged}
            />
            <FormControl fullWidth variant='filled'>
              <InputLabel id='takeoff-method-label'>
                {t('form.takeoffMethod.label')}
              </InputLabel>
              <Select
                disabled={disabled}
                labelId='takeoff-method-label'
                value={parameters.takeoffMethod}
                onChange={onTakeoffMethodChanged}
              >
                {TAKEOFF_METHODS.map((value) => (
                  <MenuItem key={value} value={value}>
                    {t(`form.takeoffMethod.type.${value}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth variant='filled'>
              <InputLabel id='rth-method-label'>
                {t('form.returnToHomeMethod.label')}
              </InputLabel>
              <Select
                disabled={disabled}
                labelId='rth-method-label'
                value={parameters.returnToHomeMethod}
                onChange={onReturnToHomeMethodChanged}
              >
                {RETURN_TO_HOME_METHODS.map((value) => (
                  <MenuItem key={value} value={value}>
                    {t(`form.returnToHomeMethod.type.${value}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </AccordionDetails>
        </Accordion>
        <Accordion
          expanded={shownSection === 'lights'}
          style={{ margin: 0 }}
          onChange={() => {
            setShownSection(shownSection === 'lights' ? 'none' : 'lights');
          }}
        >
          <AccordionSummary expandIcon={<ExpandMore />}>
            {t('panel.lights')}
          </AccordionSummary>
          <AccordionDetails className={styles.accordionDetails}>
            <LightConfigurationForm disabled={disabled} {...lights} />
          </AccordionDetails>
        </Accordion>
      </FormGroup>
    </Box>
  );
};

export default AdaptParametersForm;
