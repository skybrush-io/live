import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Slider from '@mui/material/Slider';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SimpleDurationField } from '~/components/forms';
import { HexColorInput, HexColorPicker } from '~/components/HexColorPicker';

import type { LightEffectConfiguration, LightEffectType } from './actions';

const lightEffectTypes: LightEffectType[] = [
  'off',
  'default',
  'solid',
  'sparks',
];

type DefaultConfigurationFormProps = {
  brightness: number;
  onChange: (event: Event, value: number) => void;
};

const DefaultConfigurationForm = ({
  brightness,
  onChange,
}: DefaultConfigurationFormProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'showConfiguratorDialog.lights',
  });
  return (
    <>
      <FormHelperText>{t('default.brightness')}</FormHelperText>
      <Slider
        marks
        min={0}
        max={1}
        step={0.05}
        value={brightness}
        valueLabelDisplay='auto'
        onChange={onChange}
      />
    </>
  );
};

type SolidConfigurationFormProps = {
  color: string;
  onChange: (color: string) => void;
};

const SolidConfigurationForm = ({
  color,
  onChange,
}: SolidConfigurationFormProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'showConfiguratorDialog.lights',
  });
  return (
    <>
      <FormHelperText>{t('solid.color')}</FormHelperText>
      <HexColorPicker color={color} onChange={onChange} />
      <HexColorInput
        color={color}
        style={{ alignSelf: 'center' }}
        onChange={onChange}
      />
    </>
  );
};

type SparksConfigurationFormProps = {
  offDuration: number;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
};

const SparksConfigurationForm = ({
  offDuration,
  onChange,
}: SparksConfigurationFormProps) => {
  const { t } = useTranslation(undefined, {
    keyPrefix: 'showConfiguratorDialog.lights',
  });
  return (
    <SimpleDurationField
      label={t('sparks.offDuration')}
      min={0}
      value={offDuration}
      onChange={onChange}
    />
  );
};

export const useLightConfigurationFormState = (onChange?: () => void) => {
  const [lightEffectType, setLightEffectType] =
    useState<LightEffectType>('default');
  const [defaultConfigBrightness, setDefaultConfigBrightness] = useState(0.05);
  const [solidConfigColor, setSolidConfigColor] = useState('FFF');
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
  const onSolidConfigColorChanged = useCallback(
    (color: string) => {
      setSolidConfigColor(color);
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
    if (lightEffectType === 'default') {
      return { type: 'default', brightness: defaultConfigBrightness };
    } else if (lightEffectType === 'solid') {
      return { type: 'solid', color: solidConfigColor };
    } else if (lightEffectType === 'sparks') {
      return { type: 'sparks', off_duration: sparksConfigOffDuration };
    } else {
      return { type: 'off' };
    }
  }, []);

  return {
    lightEffectType,
    configuration,
    onLightEffectTypeChanged,
    defaultConfigBrightness,
    onDefaultConfigBrightnessChanged,
    solidConfigColor,
    onSolidConfigColorChanged,
    sparksConfigOffDuration,
    onSparksConfigOffDurationChanged,
  };
};

export type LightConfigurationProps = Omit<
  ReturnType<typeof useLightConfigurationFormState>,
  'configuration'
>;

const LightConfigurationForm = (props: LightConfigurationProps) => {
  const { lightEffectType, onLightEffectTypeChanged } = props;
  const { t } = useTranslation(undefined, {
    keyPrefix: 'showConfiguratorDialog.lights',
  });
  const labelId = 'light-effect-type-label';
  return (
    <>
      <FormControl fullWidth variant='filled'>
        <InputLabel id={labelId}>{t('selectLabel')}</InputLabel>
        <Select
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
          onChange={props.onDefaultConfigBrightnessChanged}
        />
      )}
      {lightEffectType === 'solid' && (
        <SolidConfigurationForm
          color={props.solidConfigColor}
          onChange={props.onSolidConfigColorChanged}
        />
      )}
      {lightEffectType === 'sparks' && (
        <SparksConfigurationForm
          offDuration={props.sparksConfigOffDuration}
          onChange={props.onSparksConfigOffDurationChanged}
        />
      )}
    </>
  );
};

export default LightConfigurationForm;
