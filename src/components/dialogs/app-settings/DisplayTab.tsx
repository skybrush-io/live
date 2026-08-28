import config from 'config';

import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, {
  type SelectChangeEvent,
  type SelectProps,
} from '@mui/material/Select';
import type { ChangeEvent, ChangeEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import type { ThemeType } from '@skybrush/app-theme-mui';
import { FormHeader as Header, ThemeSelector } from '@skybrush/mui-components';

import Stack from '@mui/material/Stack';
import CoordinateSystemFields from '~/components/CoordinateSystemFields';
import {
  setFlatEarthCoordinateSystemOrientation,
  setFlatEarthCoordinateSystemOrigin,
  setFlatEarthCoordinateSystemType,
} from '~/features/map/origin';
import { updateAppSettings } from '~/features/settings/slice';
import type { SettingsState } from '~/features/settings/types';
import { enabledLanguages } from '~/i18n';
import { CoordinateFormat, describeCoordinateFormat } from '~/model/settings';
import { getMapOriginRotationAngle } from '~/selectors/map';
import type { RootState } from '~/store/reducers';
import type { CoordinateSystemType, LonLat } from '~/utils/geography';

const coordinateFormatOrder = [
  CoordinateFormat.DEGREES,
  CoordinateFormat.DEGREES_MINUTES,
  CoordinateFormat.DEGREES_MINUTES_SECONDS,
  CoordinateFormat.SIGNED_DEGREES,
  CoordinateFormat.SIGNED_DEGREES_MINUTES,
  CoordinateFormat.SIGNED_DEGREES_MINUTES_SECONDS,
];

type Props = {
  coordinateFormat: CoordinateFormat;
  coordinateSystemType: CoordinateSystemType;
  experimentalFeaturesEnabled: boolean;
  language: string;
  origin: LonLat;
  orientation: number;
  optimizeForSingleUAV: boolean;
  optimizeUIForTouch: boolean;
  hideInactiveSegmentsOnDarkLCD: boolean;
  showMouseCoordinates: boolean;
  showScaleLine: boolean;
  theme: ThemeType;
  onCheckboxToggled: ChangeEventHandler;
  onCoordinateSystemTypeChanged: (event: SelectChangeEvent) => void;
  onFieldChanged: (event: SelectChangeEvent) => void;
  onOriginChanged: (value: LonLat) => void;
  onOrientationChanged: (value: number | string) => void;
};

// default value for 'language' ensures that updating from a non-localized
// version does not leave the "Language" dropdown empty

const DisplayTabPresentation = ({ language = 'en', ...props }: Props) => {
  const { t } = useTranslation();
  return (
    <Stack spacing={2}>
      <Box>
        <FormControl fullWidth variant='filled'>
          <InputLabel id='language-selector-label'>
            {t('settings.display.language')}
          </InputLabel>
          <Select
            labelId='language-selector-label'
            name='language'
            value={language}
            onChange={props.onFieldChanged}
          >
            {enabledLanguages.map(({ code, label }) => (
              <MenuItem key={code} value={code}>
                {label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <ThemeSelector
        value={props.theme}
        onChange={props.onFieldChanged as SelectProps['onChange']}
      />

      <Box>
        <FormControl fullWidth variant='filled'>
          <InputLabel id='coordinate-format-label'>
            {t('settings.display.coordinateFormat')}
          </InputLabel>
          <Select
            labelId='coordinate-format-label'
            name='coordinateFormat'
            value={props.coordinateFormat}
            onChange={props.onFieldChanged}
          >
            {coordinateFormatOrder.map((coordinateFormat) => (
              <MenuItem key={coordinateFormat} value={coordinateFormat}>
                {describeCoordinateFormat(coordinateFormat, t)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormGroup>
          <Header>{t('settings.display.mapWidgets')}</Header>
          <FormControlLabel
            label={t('settings.display.showMouseCoordinates')}
            control={
              <Checkbox
                checked={props.showMouseCoordinates}
                name='showMouseCoordinates'
                onChange={props.onCheckboxToggled}
              />
            }
          />
          <FormControlLabel
            label={t('settings.display.showScaleLine')}
            control={
              <Checkbox
                checked={props.showScaleLine}
                name='showScaleLine'
                onChange={props.onCheckboxToggled}
              />
            }
          />
        </FormGroup>

        <FormGroup>
          <Header>{t('settings.display.flatEarthCoordinateSystem')}</Header>
          <CoordinateSystemFields
            origin={props.origin}
            originLabel={t('settings.display.mapOrigin')}
            orientation={props.orientation}
            orientationLabel={t('settings.display.orientationXAxis')}
            type={props.coordinateSystemType}
            onOrientationChanged={props.onOrientationChanged}
            onOriginChanged={props.onOriginChanged}
            onTypeChanged={props.onCoordinateSystemTypeChanged}
          />
        </FormGroup>

        <FormGroup>
          <Header>{t('settings.display.operationModes')}</Header>
          <FormControlLabel
            label={t('settings.display.optimizeForSingleUAV')}
            control={
              <Checkbox
                checked={props.optimizeForSingleUAV}
                disabled={config.optimizeForSingleUAV.force}
                name='optimizeForSingleUAV'
                onChange={props.onCheckboxToggled}
              />
            }
          />
          <FormControlLabel
            label={t('settings.display.optimizeUIForTouch')}
            control={
              <Checkbox
                checked={props.optimizeUIForTouch}
                disabled={config.optimizeUIForTouch.force}
                name='optimizeUIForTouch'
                onChange={props.onCheckboxToggled}
              />
            }
          />
        </FormGroup>

        <FormGroup>
          <Header>{t('settings.display.miscellaneous')}</Header>
          <FormControlLabel
            label={t('settings.display.hideInactiveSegmentsOnDarkLCD')}
            control={
              <Checkbox
                checked={props.hideInactiveSegmentsOnDarkLCD}
                name='hideInactiveSegmentsOnDarkLCD'
                onChange={props.onCheckboxToggled}
              />
            }
          />
          <FormControlLabel
            label={t('settings.display.enableExperimentalFeatures')}
            control={
              <Checkbox
                checked={props.experimentalFeaturesEnabled}
                name='experimentalFeaturesEnabled'
                onChange={props.onCheckboxToggled}
              />
            }
          />
        </FormGroup>
      </Box>
    </Stack>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    coordinateSystemType: state.map.origin.type,
    origin: state.map.origin.position,
    orientation: getMapOriginRotationAngle(state),
    ...state.settings.display,
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onCheckboxToggled(event: ChangeEvent<HTMLInputElement>) {
      dispatch(
        updateAppSettings('display', {
          [event.target.name]: event.target.checked,
        } as Partial<SettingsState['display']>)
      );
    },

    onCoordinateSystemTypeChanged(event: SelectChangeEvent) {
      dispatch(
        setFlatEarthCoordinateSystemType(
          event.target.value as CoordinateSystemType
        )
      );
    },

    onFieldChanged(event: SelectChangeEvent) {
      dispatch(
        updateAppSettings('display', {
          [event.target.name]: event.target.value,
        } as Partial<SettingsState['display']>)
      );
    },

    onOriginChanged(value: LonLat) {
      dispatch(setFlatEarthCoordinateSystemOrigin(value));
    },

    onOrientationChanged(value: number | string) {
      dispatch(setFlatEarthCoordinateSystemOrientation(String(value || 0)));
    },
  })
)(DisplayTabPresentation);
