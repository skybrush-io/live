import config from 'config';

import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
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
import ThemeSelector from '@skybrush/mui-components/lib/ThemeSelector';

import CoordinateSystemFields from '~/components/CoordinateSystemFields';
import {
  setFlatEarthCoordinateSystemOrientation,
  setFlatEarthCoordinateSystemType,
  setFlatEarthCoordinateSystemOrigin,
} from '~/features/map/origin';
import { updateAppSettings } from '~/features/settings/slice';
import { availableLanguages } from '~/i18n';
import { CoordinateFormat, describeCoordinateFormat } from '~/model/settings';
import { getMapOriginRotationAngle } from '~/selectors/map';

const coordinateFormatOrder = [
  CoordinateFormat.DEGREES,
  CoordinateFormat.DEGREES_MINUTES,
  CoordinateFormat.DEGREES_MINUTES_SECONDS,
  CoordinateFormat.SIGNED_DEGREES,
  CoordinateFormat.SIGNED_DEGREES_MINUTES,
  CoordinateFormat.SIGNED_DEGREES_MINUTES_SECONDS,
];

const DisplayTabPresentation = ({ t, ...props }) => (
  <>
    <Box my={2}>
      <FormControl fullWidth variant='filled'>
        <InputLabel id='language-selector-label'>
          {t('settings.display.language')}
        </InputLabel>
        <Select
          labelId='language-selector-label'
          name='language'
          value={props.language}
          onChange={props.onFieldChanged}
        >
          {availableLanguages.map(({ code, label }) => (
            <MenuItem key={code} value={code}>
              {label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>

    <Box my={2}>
      <ThemeSelector value={props.theme} onChange={props.onFieldChanged} />
    </Box>

    <Box my={2}>
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
              {describeCoordinateFormat(coordinateFormat)}
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
  </>
);

DisplayTabPresentation.propTypes = {
  coordinateFormat: PropTypes.oneOf(coordinateFormatOrder),
  coordinateSystemType: PropTypes.oneOf(['neu', 'nwu']),
  experimentalFeaturesEnabled: PropTypes.bool,
  language: PropTypes.string,
  origin: PropTypes.arrayOf(PropTypes.number),
  onCheckboxToggled: PropTypes.func,
  onCoordinateSystemTypeChanged: PropTypes.func,
  onFieldChanged: PropTypes.func,
  onOriginChanged: PropTypes.func,
  onOrientationChanged: PropTypes.func,
  optimizeForSingleUAV: PropTypes.bool,
  optimizeUIForTouch: PropTypes.bool,
  orientation: PropTypes.number,
  hideInactiveSegmentsOnDarkLCD: PropTypes.bool,
  showMouseCoordinates: PropTypes.bool,
  showScaleLine: PropTypes.bool,
  t: PropTypes.func,
  theme: PropTypes.oneOf(['auto', 'dark', 'light']),
};

DisplayTabPresentation.defaultProps = {
  // ensure that updating from a non-localized version does not leave the "Language" dropdown empty
  language: 'en',
};

export default connect(
  // mapStateToProps
  (state) => ({
    coordinateSystemType: state.map.origin.type,
    origin: state.map.origin.position,
    orientation: getMapOriginRotationAngle(state),
    ...state.settings.display,
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onCheckboxToggled(event) {
      dispatch(
        updateAppSettings('display', {
          [event.target.name]: event.target.checked,
        })
      );
    },

    onCoordinateSystemTypeChanged(event) {
      dispatch(setFlatEarthCoordinateSystemType(event.target.value));
    },

    onFieldChanged(event) {
      dispatch(
        updateAppSettings('display', {
          [event.target.name]: event.target.value,
        })
      );
    },

    onOriginChanged(value) {
      dispatch(setFlatEarthCoordinateSystemOrigin(value));
    },

    onOrientationChanged(value) {
      dispatch(setFlatEarthCoordinateSystemOrientation(value || 0));
    },
  })
)(withTranslation()(DisplayTabPresentation));
