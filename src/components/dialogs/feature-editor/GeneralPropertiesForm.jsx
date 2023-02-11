import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';

import SwatchesColorPicker from '~/components/SwatchesColorPicker';
import { shouldShowPointsOfFeature } from '~/features/map-features/selectors';
import {
  renameFeature,
  setFeatureColor,
  updateFeatureFillVisible,
  updateFeatureMeasurementVisible,
  updateFeaturePointsVisible,
  updateFeatureVisibility,
} from '~/features/map-features/slice';
import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';
import { primaryColor } from '~/utils/styles';
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
  shouldShowPoints,
}) => (
  <div>
    <div style={{ display: 'flex', padding: '1em 0' }}>
      <div style={{ flex: 'auto' }}>
        <TextField
          fullWidth
          autoFocus={!optimizeUIForTouch}
          label='Label'
          variant='filled'
          value={feature.label || ''}
          onChange={onSetFeatureLabel}
        />
      </div>
      <Switch
        checked={feature.visible}
        color='primary'
        style={{ flex: 'none' }}
        onChange={onToggleFeatureVisibility}
      />
    </div>
    <SwatchesColorPicker
      color={feature.color || primaryColor}
      onChangeComplete={onSetFeatureColor}
    />
    <div>
      {featureTypeHasInterior(feature.type) && (
        <FormControlLabel
          control={
            <Checkbox
              checked={feature.filled}
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
              checked={shouldShowPoints}
              indeterminate={shouldShowPoints && !feature.showPoints}
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
              checked={feature.measure}
              color='primary'
              onChange={onToggleFeatureMeasurementVisible}
            />
          }
          label='Show measurements'
        />
      )}
    </div>
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
  shouldShowPoints: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state, { featureId }) => ({
    optimizeUIForTouch: shouldOptimizeUIForTouch(state),
    shouldShowPoints: shouldShowPointsOfFeature(state, featureId),
  }),
  // mapDispatchToProps
  (dispatch, { featureId }) => ({
    onSetFeatureColor(color) {
      dispatch(setFeatureColor({ id: featureId, color: color.hex }));
    },
    onSetFeatureLabel(event) {
      dispatch(renameFeature({ id: featureId, name: event.target.value }));
    },
    onToggleFeatureFillVisible(_event, checked) {
      dispatch(updateFeatureFillVisible({ id: featureId, filled: checked }));
    },
    onToggleFeatureMeasurementVisible(_event, checked) {
      dispatch(
        updateFeatureMeasurementVisible({ id: featureId, measure: checked })
      );
    },
    onToggleFeaturePointsVisible(_event, checked) {
      dispatch(updateFeaturePointsVisible({ id: featureId, visible: checked }));
    },
    onToggleFeatureVisibility(_event, checked) {
      dispatch(updateFeatureVisibility({ id: featureId, visible: checked }));
    },
  })
)(GeneralPropertiesForm);
