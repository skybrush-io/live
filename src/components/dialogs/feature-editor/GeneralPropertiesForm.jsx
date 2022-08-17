import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';

import SwatchesColorPicker from '~/components/SwatchesColorPicker';
import {
  renameFeature,
  setFeatureColor,
  updateFeatureFill,
  updateFeatureVisibility,
} from '~/features/map-features/slice';
import { primaryColor } from '~/utils/styles';

const GeneralPropertiesForm = ({
  feature,
  onSetFeatureColor,
  onSetFeatureLabel,
  onToggleFeatureFill,
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
    <div style={{ display: 'flex', padding: '1em 0' }}>
      <div style={{ flex: 'auto' }}>
        <SwatchesColorPicker
          color={feature.color || primaryColor}
          onChangeComplete={onSetFeatureColor}
        />
      </div>
      <FormControlLabel
        style={{ margin: '0' }}
        control={
          <Switch
            checked={feature.filled}
            color='primary'
            onChange={onToggleFeatureFill}
          />
        }
        label='Fill'
        labelPlacement='top'
      />
    </div>
  </div>
);

GeneralPropertiesForm.propTypes = {
  feature: PropTypes.object.isRequired,
  onSetFeatureColor: PropTypes.func,
  onSetFeatureLabel: PropTypes.func,
  onToggleFeatureFill: PropTypes.func,
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
    onToggleFeatureFill(_event, checked) {
      dispatch(updateFeatureFill({ id: featureId, filled: checked }));
    },
    onToggleFeatureVisibility(_event, checked) {
      dispatch(updateFeatureVisibility({ id: featureId, visible: checked }));
    },
  })
)(GeneralPropertiesForm);
