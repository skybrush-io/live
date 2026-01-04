import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import Typography from '@mui/material/Typography';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import { SimpleDurationField } from '~/components/forms';
import { HexColorInput, HexColorPicker } from '~/components/HexColorPicker';
import { getServerVersionValidator } from '~/features/servers/selectors';

import type { LightEffectConfiguration, LightEffectType } from './actions';

const lightEffectTypes: LightEffectType[] = [
  'off',
  'default',
  'solid',
  'sparks',
];

type DefaultConfigurationFormProps = {
  brightness: number;
  disabled?: boolean;
  onChanged: (event: Event, value: number) => void;
};

const DefaultConfigurationForm = ({
  brightness,
  disabled,
  onChanged,
}: DefaultConfigurationFormProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'showConfiguratorDialog.lights',
  });
  return (
    <>
      <FormHelperText>{t('default.brightness')}</FormHelperText>
      <Slider
        marks
        disabled={disabled}
        min={0}
        max={1}
        step={0.05}
        value={brightness}
        valueLabelDisplay='auto'
        onChange={onChanged}
      />
    </>
  );
};

type SolidConfigurationFormProps = {
  color: string;
  disabled?: boolean;
  onColorChanged: (color: string) => void;
};

const SolidConfigurationForm = ({
  color,
  disabled,
  onColorChanged,
}: SolidConfigurationFormProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'showConfiguratorDialog.lights',
  });
  // TODO: update when upgrading to React 19 which recognizes the
  // inert as a boolean attribute. Hopefully TS also won't complain
  // if we set the attribute directly on the picker...
  const extraProps = disabled ? { inert: '' } : {};
  return (
    <>
      <FormHelperText>{t('solid.color')}</FormHelperText>
      <HexColorPicker color={color} {...extraProps} onChange={onColorChanged} />
      <HexColorInput
        color={color}
        disabled={disabled}
        style={{ alignSelf: 'center' }}
        onChange={onColorChanged}
      />
    </>
  );
};

type SparksConfigurationFormProps = {
  color: string;
  disabled?: boolean;
  offDuration: number;
  onColorChanged: (color: string) => void;
  onDurationChanged: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const SparksConfigurationForm = ({
  color,
  disabled,
  offDuration,
  onColorChanged,
  onDurationChanged,
}: SparksConfigurationFormProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'showConfiguratorDialog.lights',
  });
  // TODO: update when upgrading to React 19 which recognizes the
  // inert as a boolean attribute. Hopefully TS also won't complain
  // if we set the attribute directly on the picker...
  const extraProps = disabled ? { inert: '' } : {};
  return (
    <>
      <SimpleDurationField
        disabled={disabled}
        label={t('sparks.offDuration')}
        min={0}
        value={offDuration}
        onChange={onDurationChanged}
      />
      <HexColorPicker color={color} {...extraProps} onChange={onColorChanged} />
      <HexColorInput
        color={color}
        disabled={disabled}
        style={{ alignSelf: 'center' }}
        onChange={onColorChanged}
      />
    </>
  );
};

export const useLightConfigurationFormState = (onChange?: () => void) => {
  const [lightEffectType, setLightEffectType] =
    useState<LightEffectType>('default');
  const [defaultConfigBrightness, setDefaultConfigBrightness] = useState(0.05);
  const [color, setColor] = useState('FFF');
  const [sparksConfigOffDuration, setSparksConfigOffDuration] = useState(3);

  const onLightEffectTypeChanged = useCallback(
    (evt: { target: { value: LightEffectType } }) => {
      setLightEffectType(evt.target.value);
      onChange?.();
    },
    [onChange]
  );
  const onDefaultConfigBrightnessChanged = useCallback(
    (_evt: Event, brightness: number) => {
      setDefaultConfigBrightness(
        Number.isFinite(brightness) ? brightness : 0.05
      );
      onChange?.();
    },
    [onChange]
  );
  const onColorChanged = useCallback(
    (color: string) => {
      setColor(color);
      onChange?.();
    },
    [onChange]
  );
  const onSparksConfigOffDurationChanged = useCallback(
    (evt: React.ChangeEvent<HTMLInputElement>) => {
      const offDuration =
        Math.round(Number.parseFloat(evt.target.value) * 100) * 0.01;
      setSparksConfigOffDuration(
        Number.isFinite(offDuration) ? offDuration : 3
      );
      onChange?.();
    },
    [onChange]
  );

  const configuration: LightEffectConfiguration = useMemo(() => {
    switch (lightEffectType) {
      case 'default':
        return { type: 'default', brightness: defaultConfigBrightness };

      case 'solid':
        return { type: 'solid', color };

      case 'sparks':
        return { type: 'sparks', color, off_duration: sparksConfigOffDuration };

      default:
        return { type: 'off' };
    }
  }, [
    lightEffectType,
    defaultConfigBrightness,
    color,
    sparksConfigOffDuration,
  ]);

  return {
    lightEffectType,
    configuration,
    onLightEffectTypeChanged,
    defaultConfigBrightness,
    onDefaultConfigBrightnessChanged,
    color,
    onColorChanged,
    sparksConfigOffDuration,
    onSparksConfigOffDurationChanged,
  };
};

const MIN_VERSION = '2.40';
const supportsLightConfiguration = getServerVersionValidator(
  `>=${MIN_VERSION}`
);

export type LightConfigurationProps = Omit<
  ReturnType<typeof useLightConfigurationFormState>,
  'configuration'
> & { disabled?: boolean };

const LightConfigurationForm = (props: LightConfigurationProps) => {
  const { disabled, lightEffectType, onLightEffectTypeChanged } = props;
  const { t } = useTranslation(undefined, {
    keyPrefix: 'showConfiguratorDialog.lights',
  });
  const isSupported = useSelector(supportsLightConfiguration);
  const labelId = 'light-effect-type-label';
  return isSupported ? (
    <>
      <FormControl fullWidth variant='filled'>
        <InputLabel id={labelId}>{t('selectLabel')}</InputLabel>
        <Select
          disabled={disabled}
          labelId={labelId}
          value={lightEffectType}
          onChange={onLightEffectTypeChanged}
        >
          {lightEffectTypes.map((type) => (
            <MenuItem key={type} value={type}>
              {t(`type.${type}`)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {lightEffectType === 'default' && (
        <DefaultConfigurationForm
          brightness={props.defaultConfigBrightness}
          disabled={disabled}
          onChanged={props.onDefaultConfigBrightnessChanged}
        />
      )}
      {lightEffectType === 'solid' && (
        <SolidConfigurationForm
          color={props.color}
          disabled={disabled}
          onColorChanged={props.onColorChanged}
        />
      )}
      {lightEffectType === 'sparks' && (
        <SparksConfigurationForm
          color={props.color}
          disabled={disabled}
          offDuration={props.sparksConfigOffDuration}
          onColorChanged={props.onColorChanged}
          onDurationChanged={props.onSparksConfigOffDurationChanged}
        />
      )}
    </>
  ) : (
    <Typography color='warning'>
      {t('unsupportedVersion', { minVersion: MIN_VERSION })}
    </Typography>
  );
};

export default LightConfigurationForm;
