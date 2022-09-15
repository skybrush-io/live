import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';

import SwatchesColorPicker from '~/components/SwatchesColorPicker';
import {
  renameFeature,
  setFeatureColor,
  updateFeatureFillVisible,
  updateFeaturePointsVisible,
  updateFeatureVisibility,
} from '~/features/map-features/slice';
import { primaryColor } from '~/utils/styles';
import { featureTypeHasPoints } from '~/model/features';

const GeneralPropertiesForm = ({
  feature,
  onSetFeatureColor,
  onSetFeatureLabel,
  onToggleFeatureFillVisible,
  onToggleFeaturePointsVisible,
  onToggleFeatureVisibility,
}) => (
  <div>
    <div style={{ display: 'flex', padding: '1em 0' }}>
      <div style={{ flex: 'auto' }}>
        <TextField
          autoFocus
          fullWidth
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
      {featureTypeHasPoints(feature.type) && (
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(feature.showPoints)}
              color='primary'
              onChange={onToggleFeaturePointsVisible}
            />
          }
          label='Show individual points'
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
  onToggleFeaturePointsVisible: PropTypes.func,
  onToggleFeatureVisibility: PropTypes.func,
};

export default connect(
  // mapStateToProps
  null,
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
    onToggleFeaturePointsVisible(_event, checked) {
      dispatch(updateFeaturePointsVisible({ id: featureId, visible: checked }));
    },
    onToggleFeatureVisibility(_event, checked) {
      dispatch(updateFeatureVisibility({ id: featureId, visible: checked }));
    },
  })
)(GeneralPropertiesForm);
