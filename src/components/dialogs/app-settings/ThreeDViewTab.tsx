import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import type { ChangeEvent, ChangeEventHandler } from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import { FormHeader as Header } from '@skybrush/mui-components';

import {
  getLightingConditionsForThreeDView,
  getSceneryForThreeDView,
} from '~/features/settings/selectors';
import { updateAppSettings } from '~/features/settings/slice';
import type { SettingsState } from '~/features/settings/types';
import { tt, type PreparedI18nKey } from '~/i18n';
import type { RootState } from '~/store/reducers';

type I18nAwareLabeledOption = { id: string; label: PreparedI18nKey };

const sceneries: I18nAwareLabeledOption[] = [
  {
    id: 'auto',
    label: tt('settings.threeDView.auto'),
  },
  {
    id: 'outdoor',
    label: tt('settings.threeDView.outdoor'),
  },
  {
    id: 'indoor',
    label: tt('settings.threeDView.indoor'),
  },
];

const lightingConditions: I18nAwareLabeledOption[] = [
  {
    id: 'light',
    label: tt('settings.threeDView.light'),
  },
  {
    id: 'dark',
    label: tt('settings.threeDView.dark'),
  },
];

const grids: I18nAwareLabeledOption[] = [
  {
    id: 'none',
    label: tt('settings.threeDView.none'),
  },
  {
    id: '1x1',
    label: tt('settings.threeDView.1x1'),
  },
  {
    id: '2x2',
    label: tt('settings.threeDView.2x2'),
  },
];

type Props = {
  grid: string;
  lighting: string;
  scenery: string;
  showAxes: boolean;
  showHomePositions: boolean;
  showLandingPositions: boolean;
  showTrajectoriesOfSelection: boolean;
  showStatistics: boolean;
  onCheckboxToggled: ChangeEventHandler;
  onFieldChanged: (event: { target: { name: string; value: string } }) => void;
};

const ThreeDViewTab = (props: Props) => (
  <Translation>
    {(t) => (
      <Box>
        <FormGroup>
          <Header disablePadding>{t('settings.threeDView.environment')}</Header>
          <Box sx={{ display: 'flex' }}>
            <FormControl fullWidth variant='filled'>
              <InputLabel id='threed-scenery-label'>
                {t('settings.threeDView.scenery')}
              </InputLabel>
              <Select
                labelId='threed-scenery-label'
                name='scenery'
                value={props.scenery}
                onChange={props.onFieldChanged}
              >
                {sceneries.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.label(t)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ px: 1 }} />
            <FormControl fullWidth variant='filled'>
              <InputLabel id='threed-lighting-label'>
                {t('settings.threeDView.lighting')}
              </InputLabel>
              <Select
                labelId='threed-lighting-label'
                name='lighting'
                value={props.lighting}
                onChange={props.onFieldChanged}
              >
                {lightingConditions.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.label(t)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box sx={{ px: 1 }} />
            <FormControl fullWidth variant='filled'>
              <InputLabel id='threed-grid-label'>
                {t('settings.threeDView.grid')}
              </InputLabel>
              <Select
                labelId='threed-grid-label'
                name='grid'
                value={props.grid}
                onChange={props.onFieldChanged}
              >
                {grids.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.label(t)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FormControlLabel
            label={t('settings.threeDView.showAxes')}
            control={
              <Checkbox
                checked={props.showAxes}
                name='showAxes'
                onChange={props.onCheckboxToggled}
              />
            }
          />

          <FormControlLabel
            label={t('settings.threeDView.showHomePositions')}
            control={
              <Checkbox
                checked={props.showHomePositions}
                name='showHomePositions'
                onChange={props.onCheckboxToggled}
              />
            }
          />

          <FormControlLabel
            label={t('settings.threeDView.showLandingPositions')}
            control={
              <Checkbox
                checked={props.showLandingPositions}
                name='showLandingPositions'
                onChange={props.onCheckboxToggled}
              />
            }
          />

          <FormControlLabel
            label={t('settings.threeDView.showTrajectoriesOfSelection')}
            control={
              <Checkbox
                checked={props.showTrajectoriesOfSelection}
                name='showTrajectoriesOfSelection'
                onChange={props.onCheckboxToggled}
              />
            }
          />
        </FormGroup>

        <FormGroup>
          <Header>{t('settings.threeDView.rendering')}</Header>
          <FormControlLabel
            label={t('settings.threeDView.showStatistics')}
            control={
              <Checkbox
                checked={props.showStatistics}
                name='showStatistics'
                onChange={props.onCheckboxToggled}
              />
            }
          />
        </FormGroup>
      </Box>
    )}
  </Translation>
);

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    ...state.settings.threeD,
    scenery: getSceneryForThreeDView(state),
    lighting: getLightingConditionsForThreeDView(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onCheckboxToggled(event: ChangeEvent<HTMLInputElement>) {
      dispatch(
        updateAppSettings('threeD', {
          [event.target.name]: event.target.checked,
        } as Partial<SettingsState['threeD']>)
      );
    },

    onFieldChanged(event: { target: { name: string; value: string } }) {
      dispatch(
        updateAppSettings('threeD', {
          [event.target.name]: event.target.value,
        } as Partial<SettingsState['threeD']>)
      );
    },
  })
)(ThreeDViewTab);
