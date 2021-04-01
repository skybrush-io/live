import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Checkbox from '@material-ui/core/Checkbox';
import Divider from '@material-ui/core/Divider';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import Typography from '@material-ui/core/Typography';
import { useTheme } from '@material-ui/core/styles';

import Header from '@skybrush/mui-components/lib/FormHeader';

import {
  SimpleAngleField,
  SimpleDistanceField,
  SimpleDurationField,
  SimpleNumericField,
  SimpleVoltageField,
} from '~/components/forms';
import { updateUAVVoltageThreshold } from '~/features/settings/actions';
import { updateAppSettings } from '~/features/settings/slice';
import {
  getDesiredPlacementAccuracyInMeters,
  getDesiredTakeoffHeadingAccuracy,
} from '~/features/settings/selectors';

const UAVsTabPresentation = ({
  autoRemove,
  criticalVoltageThreshold,
  defaultBatteryCellCount,
  forgetThreshold,
  fullChargeVoltage,
  goneThreshold,
  lowVoltageThreshold,
  onCheckboxToggled,
  onDistanceFieldUpdated,
  onEnumFieldUpdated,
  onIntegerFieldUpdated,
  onVoltageFieldUpdated,
  placementAccuracy,
  preferredBatteryDisplayStyle,
  takeoffHeadingAccuracy,
  warnThreshold,
}) => {
  const theme = useTheme();
  return (
    <>
      <FormGroup style={{ marginBottom: theme.spacing(2) }}>
        <FormControl style={{ alignItems: 'center', flexDirection: 'row' }}>
          <FormControlLabel
            label='Warn about drones not seen for at least'
            control={<Checkbox checked style={{ visibility: 'hidden' }} />}
          />
          <SimpleDurationField
            name='warnThreshold'
            min={1}
            max={3600}
            value={warnThreshold}
            variant='standard'
            onChange={onIntegerFieldUpdated}
          />
        </FormControl>

        <FormControl style={{ alignItems: 'center', flexDirection: 'row' }}>
          <FormControlLabel
            label='Mark drones as gone after'
            control={<Checkbox checked style={{ visibility: 'hidden' }} />}
          />
          <SimpleDurationField
            name='goneThreshold'
            min={1}
            max={3600}
            value={goneThreshold}
            variant='standard'
            onChange={onIntegerFieldUpdated}
          />
        </FormControl>

        <FormControl style={{ alignItems: 'center', flexDirection: 'row' }}>
          <FormControlLabel
            label='Forget unseen drones after'
            control={
              <Checkbox
                checked={Boolean(autoRemove)}
                name='autoRemove'
                onChange={onCheckboxToggled}
              />
            }
          />
          <SimpleDurationField
            name='forgetThreshold'
            min={1}
            max={3600}
            value={forgetThreshold}
            disabled={!autoRemove}
            variant='standard'
            onChange={onIntegerFieldUpdated}
          />
        </FormControl>
      </FormGroup>

      <Divider />

      <Box my={2}>
        <Header>Default battery settings</Header>

        <Box display='flex' flexDirection='row' mb={1}>
          <SimpleNumericField
            fullWidth
            label='Cell count'
            name='defaultBatteryCellCount'
            min={1}
            max={24}
            step={1}
            value={defaultBatteryCellCount}
            onChange={onIntegerFieldUpdated}
          />
          <Box width={theme.spacing(2)} />
          <SimpleVoltageField
            fullWidth
            name='fullChargeVoltage'
            label='Full charge'
            min={0.1}
            max={20}
            step={0.1}
            value={fullChargeVoltage}
            onChange={onVoltageFieldUpdated}
          />
          <Box width={theme.spacing(2)} />
          <SimpleVoltageField
            fullWidth
            name='lowVoltageThreshold'
            label='Low threshold'
            min={0.1}
            max={20}
            step={0.1}
            value={lowVoltageThreshold}
            onChange={onVoltageFieldUpdated}
          />
          <Box width={theme.spacing(2)} />
          <SimpleVoltageField
            fullWidth
            name='criticalVoltageThreshold'
            label='Critical threshold'
            min={0.1}
            max={20}
            step={0.1}
            value={criticalVoltageThreshold}
            onChange={onVoltageFieldUpdated}
          />
        </Box>

        <Box display='flex' flexDirection='row' mb={1}>
          <FormControl fullWidth variant='filled'>
            <InputLabel id='uav-battery-display-style'>
              Battery display style
            </InputLabel>
            <Select
              labelId='uav-battery-display-style'
              name='preferredBatteryDisplayStyle'
              value={preferredBatteryDisplayStyle}
              onChange={onEnumFieldUpdated}
            >
              <MenuItem value='voltage'>Prefer voltage</MenuItem>
              <MenuItem value='percentage'>
                Prefer percentage and show voltage if unknown
              </MenuItem>
              <MenuItem value='forcedPercentage'>
                Prefer percentage and estimate it from voltage if needed
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Divider />

      <Box my={2}>
        <Header>Mission setup</Header>

        <Box display='flex' flexDirection='row' mb={1}>
          <SimpleDistanceField
            fullWidth
            name='placementAccuracy'
            label='Desired placement accuracy'
            min={0.5}
            max={20}
            step={0.5}
            value={placementAccuracy}
            onChange={onDistanceFieldUpdated}
          />
          <Box width={theme.spacing(2)} />
          <SimpleAngleField
            fullWidth
            name='takeoffHeadingAccuracy'
            label='Desired heading accuracy'
            min={1}
            max={45}
            step={1}
            value={takeoffHeadingAccuracy}
            onChange={onIntegerFieldUpdated}
          />
        </Box>

        <Typography variant='body2' color='textSecondary'>
          Used before multi-drone missions to check whether each drone is at its
          prescribed takeoff position and is facing the right direction.
        </Typography>
      </Box>
    </>
  );
};

UAVsTabPresentation.propTypes = {
  autoRemove: PropTypes.bool,
  criticalVoltageThreshold: PropTypes.number,
  defaultBatteryCellCount: PropTypes.number,
  forgetThreshold: PropTypes.number,
  fullChargeVoltage: PropTypes.number,
  goneThreshold: PropTypes.number,
  lowVoltageThreshold: PropTypes.number,
  onCheckboxToggled: PropTypes.func,
  onDistanceFieldUpdated: PropTypes.func,
  onEnumFieldUpdated: PropTypes.func,
  onIntegerFieldUpdated: PropTypes.func,
  onVoltageFieldUpdated: PropTypes.func,
  placementAccuracy: PropTypes.number,
  preferredBatteryDisplayStyle: PropTypes.oneOf([
    'voltage',
    'percentage',
    'forcedPercentage',
  ]),
  takeoffHeadingAccuracy: PropTypes.number,
  warnThreshold: PropTypes.number,
};

UAVsTabPresentation.defaultProps = {
  preferredBatteryDisplayStyle: 'voltage',
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.settings.uavs,
    placementAccuracy: getDesiredPlacementAccuracyInMeters(state),
    takeoffHeadingAccuracy: getDesiredTakeoffHeadingAccuracy(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onCheckboxToggled(event) {
      dispatch(
        updateAppSettings('uavs', {
          [event.target.name]: event.target.checked,
        })
      );
    },

    onDistanceFieldUpdated(event) {
      // We store millimeters in the Redux store to avoid rounding errors
      const distance = Math.round(Number.parseFloat(event.target.value) * 1000);

      if (distance > 0) {
        dispatch(
          updateAppSettings('uavs', {
            [event.target.name]: distance,
          })
        );
      }
    },

    onEnumFieldUpdated(event) {
      dispatch(
        updateAppSettings('uavs', {
          [event.target.name]: event.target.value,
        })
      );
    },

    onIntegerFieldUpdated(event) {
      const value = Number.parseInt(event.target.value, 10);

      if (value > 0) {
        dispatch(
          updateAppSettings('uavs', {
            [event.target.name]: value,
          })
        );
      }
    },

    onVoltageFieldUpdated(event) {
      const value = Number.parseFloat(event.target.value);

      if (value > 0 && Number.isFinite(value)) {
        dispatch(updateUAVVoltageThreshold(event.target.name, value));
      }
    },
  })
)(UAVsTabPresentation);
