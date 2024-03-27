import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';

import AutoCheckBox from '~/icons/AutoCheckBox';
import CheckBox from '@material-ui/icons/CheckBox';
import CheckBoxOutlineBlank from '@material-ui/icons/CheckBoxOutlineBlank';

import SwatchesColorPicker from '~/components/SwatchesColorPicker';
import {
  shouldFillFeature,
  shouldShowPointsOfFeature,
  suggestedColorForFeature,
} from '~/features/map-features/selectors-style-suggestions';
import {
  renameFeature,
  setFeatureColor,
  toggleFeatureFillVisible,
  toggleFeatureMeasurementVisible,
  toggleFeaturePointsVisible,
  updateFeatureVisibility,
} from '~/features/map-features/slice';
import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';
import {
  featureTypeCanBeMeasured,
  featureTypeHasInterior,
  featureTypeHasPoints,
} from '~/model/features';

const GeneralPropertiesForm = ({
  feature,
  onSetFeatureColor,
  onSetFeatureLabel,
  onToggleFeatureFillVisible,
  onToggleFeatureMeasurementVisible,
  onToggleFeaturePointsVisible,
  onToggleFeatureVisibility,
  optimizeUIForTouch,
  shouldFill,
  shouldShowPoints,
  suggestedColor,
}) => (
  <div>
    <Box display='flex' alignItems='center' py='1em'>
      <Box flex='auto'>
        <TextField
          fullWidth
          autoFocus={!optimizeUIForTouch}
          label='Label'
          variant='filled'
          value={feature.label || ''}
          onChange={onSetFeatureLabel}
        />
      </Box>
      <Switch
        checked={feature.visible}
        color='primary'
        onChange={onToggleFeatureVisibility}
      />
    </Box>
    <Box display='flex'>
      <SwatchesColorPicker
        styles={{ default: { picker: { flexShrink: 0 } } }}
        color={feature.color ?? suggestedColor}
        onChangeComplete={onSetFeatureColor}
      />
      <Button
        disabled={feature.color === undefined}
        onClick={() => onSetFeatureColor()}
      >
        <div>
          <AutoCheckBox fontSize='large' />
          Automatic color
        </div>
      </Button>
    </Box>
    <div>
      {featureTypeHasInterior(feature.type) && (
        <FormControlLabel
          control={
            <Checkbox
              checked={feature.filled ?? shouldFill}
              indeterminate={feature.filled === undefined}
              indeterminateIcon={<AutoCheckBox />}
              color='primary'
              onChange={onToggleFeatureFillVisible}
            />
          }
          label='Fill interior'
        />
      )}
      {featureTypeHasPoints(feature.type) && (
        <FormControlLabel
          control={
            <Checkbox
              checked={feature.showPoints ?? shouldShowPoints}
              indeterminate={feature.showPoints === undefined}
              indeterminateIcon={<AutoCheckBox />}
              color='primary'
              onChange={onToggleFeaturePointsVisible}
            />
          }
          label='Show individual points'
        />
      )}
      {featureTypeCanBeMeasured(feature.type) && (
        <FormControlLabel
          control={
            <Checkbox
              checked={feature.measure ?? false}
              indeterminate={feature.measure === undefined}
              indeterminateIcon={<AutoCheckBox />}
              color='primary'
              onChange={onToggleFeatureMeasurementVisible}
            />
          }
          label='Show measurements'
        />
      )}
    </div>
    {(() => {
      const iconProps = {
        fontSize: 'inherit',
        style: { verticalAlign: 'text-top' },
      };

      return (
        <FormHelperText style={{ marginTop: -8 }}>
          Click to cycle between automatic (
          <AutoCheckBox {...iconProps} />
          ), enabled (<CheckBox {...iconProps} />) and disabled (
          <CheckBoxOutlineBlank {...iconProps} />) states.
        </FormHelperText>
      );
    })()}
  </div>
);

GeneralPropertiesForm.propTypes = {
  feature: PropTypes.object.isRequired,
  onSetFeatureColor: PropTypes.func,
  onSetFeatureLabel: PropTypes.func,
  onToggleFeatureFillVisible: PropTypes.func,
  onToggleFeatureMeasurementVisible: PropTypes.func,
  onToggleFeaturePointsVisible: PropTypes.func,
  onToggleFeatureVisibility: PropTypes.func,
  optimizeUIForTouch: PropTypes.bool,
  shouldFill: PropTypes.bool,
  shouldShowPoints: PropTypes.bool,
  suggestedColor: PropTypes.string,
};

export default connect(
  // mapStateToProps
  (state, { featureId }) => ({
    optimizeUIForTouch: shouldOptimizeUIForTouch(state),
    shouldFill: shouldFillFeature(state, featureId),
    shouldShowPoints: shouldShowPointsOfFeature(state, featureId),
    suggestedColor: suggestedColorForFeature(state, featureId),
  }),
  // mapDispatchToProps
  (dispatch, { featureId }) => ({
    onSetFeatureColor(color) {
      dispatch(setFeatureColor({ id: featureId, color: color?.hex }));
    },
    onSetFeatureLabel(event) {
      dispatch(renameFeature({ id: featureId, name: event.target.value }));
    },
    onToggleFeatureFillVisible() {
      dispatch(toggleFeatureFillVisible({ id: featureId }));
    },
    onToggleFeatureMeasurementVisible() {
      dispatch(toggleFeatureMeasurementVisible({ id: featureId }));
    },
    onToggleFeaturePointsVisible() {
      dispatch(toggleFeaturePointsVisible({ id: featureId }));
    },
    onToggleFeatureVisibility(_event, checked) {
      dispatch(updateFeatureVisibility({ id: featureId, visible: checked }));
    },
  })
)(GeneralPropertiesForm);
