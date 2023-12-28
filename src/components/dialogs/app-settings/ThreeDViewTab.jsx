import PropTypes from 'prop-types';
import React from 'react';
import { Translation } from 'react-i18next';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

import Header from '@skybrush/mui-components/lib/FormHeader';

import {
  getLightingConditionsForThreeDView,
  getSceneryForThreeDView,
} from '~/features/settings/selectors';
import { updateAppSettings } from '~/features/settings/slice';

const sceneries = [
  {
    id: 'auto',
    label: 'settings.threeDView.auto',
  },
  {
    id: 'outdoor',
    label: 'settings.threeDView.outdoor',
  },
  {
    id: 'indoor',
    label: 'settings.threeDView.indoor',
  },
];

const lightingConditions = [
  {
    id: 'light',
    label: 'settings.threeDView.light',
  },
  {
    id: 'dark',
    label: 'settings.threeDView.dark',
  },
];

const grids = [
  {
    id: 'none',
    label: 'settings.threeDView.none',
  },
  {
    id: '1x1',
    label: 'settings.threeDView.1x1',
  },
  {
    id: '2x2',
    label: 'settings.threeDView.2x2',
  },
];

const ThreeDViewTab = (props) => (
  <Translation>
    {(t) => (
      <Box mb={2}>
        <FormGroup>
          <Header>{t('settings.threeDView.environment')}</Header>
          <Box display='flex'>
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
                    {t(item.label) /* i18next-extract-disable-line */}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box px={1} />
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
                    {t(item.label)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Box px={1} />
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
                    {t(item.label)}
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

ThreeDViewTab.propTypes = {
  grid: PropTypes.string,
  lighting: PropTypes.string,
  onCheckboxToggled: PropTypes.func,
  onFieldChanged: PropTypes.func,
  scenery: PropTypes.string,
  showAxes: PropTypes.bool,
  showHomePositions: PropTypes.bool,
  showLandingPositions: PropTypes.bool,
  showTrajectoriesOfSelection: PropTypes.bool,
  showStatistics: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.settings.threeD,
    scenery: getSceneryForThreeDView(state),
    lighting: getLightingConditionsForThreeDView(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onCheckboxToggled(event) {
      dispatch(
        updateAppSettings('threeD', {
          [event.target.name]: event.target.checked,
        })
      );
    },

    onFieldChanged(event) {
      dispatch(
        updateAppSettings('threeD', {
          [event.target.name]: event.target.value,
        })
      );
    },
  })
)(ThreeDViewTab);
