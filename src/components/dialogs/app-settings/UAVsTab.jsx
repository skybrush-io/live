import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Header from '@skybrush/mui-components/lib/FormHeader';

import {
  SimpleAngleField,
  SimpleDistanceField,
  SimpleDurationField,
  SimpleNumericField,
  SimpleVoltageField,
} from '~/components/forms';
import { updateUAVVoltageThreshold } from '~/features/settings/actions';
import {
  getDesiredPlacementAccuracyInMeters,
  getDesiredTakeoffHeadingAccuracy,
  getMaximumConcurrentUploadTaskCount,
  getMinimumIndoorTakeoffSpacing,
  getMinimumOutdoorTakeoffSpacing,
} from '~/features/settings/selectors';
import { updateAppSettings } from '~/features/settings/slice';
import {
  BatteryDisplayStyle,
  describeBatteryDisplayStyle,
  describeUAVOperationConfirmationStyle,
  UAVOperationConfirmationStyle,
} from '~/model/settings';

const batteryDisplayStyleOrder = [
  BatteryDisplayStyle.VOLTAGE,
  BatteryDisplayStyle.PERCENTAGE,
  BatteryDisplayStyle.FORCED_PERCENTAGE,
];

const uavOperationConfirmationStyleOrder = [
  UAVOperationConfirmationStyle.NEVER,
  UAVOperationConfirmationStyle.ONLY_MULTIPLE,
  UAVOperationConfirmationStyle.ALWAYS,
];

const UAVsTabPresentation = ({
  autoRemove,
  criticalVoltageThreshold,
  defaultBatteryCellCount,
  forgetThreshold,
  fullChargeVoltage,
  goneThreshold,
  lowVoltageThreshold,
  maxUploadConcurrency,
  minIndoorTakeoffSpacing,
  minOutdoorTakeoffSpacing,
  onCheckboxToggled,
  onDistanceFieldUpdated,
  onEnumFieldUpdated,
  onIntegerFieldUpdated,
  onVoltageFieldUpdated,
  placementAccuracy,
  preferredBatteryDisplayStyle,
  t,
  takeoffHeadingAccuracy,
  uavOperationConfirmationStyle,
  warnThreshold,
}) => {
  const theme = useTheme();
  return (
    <>
      <FormGroup style={{ marginBottom: theme.spacing(2) }}>
        <FormControl style={{ alignItems: 'center', flexDirection: 'row' }}>
          <FormControlLabel
            label={t('settings.uavs.warn')}
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
            label={t('settings.uavs.gone')}
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
            label={t('settings.uavs.forget')}
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

      <Box my={2}>
        <Header>{t('settings.uavs.operationSettings')}</Header>

        <Box display='flex' flexDirection='row' mb={1}>
          <FormControl fullWidth variant='filled'>
            <InputLabel id='uav-operation-confirmation-style'>
              UAV operation confirmations
            </InputLabel>
            <Select
              labelId='uav-operation-confirmation-style'
              name='uavOperationConfirmationStyle'
              value={
                uavOperationConfirmationStyle ||
                UAVOperationConfirmationStyle.NEVER
              }
              onChange={onEnumFieldUpdated}
            >
              {uavOperationConfirmationStyleOrder.map((value) => (
                <MenuItem key={value} value={value}>
                  {describeUAVOperationConfirmationStyle(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box display='flex' flexDirection='row' mb={1}>
          <SimpleNumericField
            fullWidth
            label={t('settings.uavs.maxUploadConcurrency')}
            name='maxUploadConcurrency'
            min={1}
            max={250}
            step={1}
            value={maxUploadConcurrency}
            onChange={onIntegerFieldUpdated}
          />
        </Box>
      </Box>

      <Box my={2}>
        <Header>{t('settings.uavs.defaultBatterySettings')}</Header>

        <Box display='flex' flexDirection='row' mb={1}>
          <SimpleNumericField
            fullWidth
            label={t('settings.uavs.cellCount')}
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
            label={t('settings.uavs.fullCharge')}
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
            label={t('settings.uavs.lowTreshold')}
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
            label={t('settings.uavs.criticalTreshold')}
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
              {t('settings.uavs.batteryDisplayStyle')}
            </InputLabel>
            <Select
              labelId='uav-battery-display-style'
              name='preferredBatteryDisplayStyle'
              value={preferredBatteryDisplayStyle}
              onChange={onEnumFieldUpdated}
            >
              {batteryDisplayStyleOrder.map((value) => (
                <MenuItem key={value} value={value}>
                  {describeBatteryDisplayStyle(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box>
        <Header>{t('settings.uavs.missionSetup')}</Header>

        <Box display='flex' flexDirection='row' mb={1}>
          <SimpleDistanceField
            fullWidth
            name='minOutdoorTakeoffSpacing'
            label={t('settings.uavs.minOutdoorTakeoffSpacing')}
            min={0.1}
            max={10}
            step={0.1}
            value={minOutdoorTakeoffSpacing}
            onChange={onDistanceFieldUpdated}
          />
          <Box width={theme.spacing(2)} />
          <SimpleDistanceField
            fullWidth
            name='minIndoorTakeoffSpacing'
            label={t('settings.uavs.minIndoorTakeoffSpacing')}
            min={0.1}
            max={10}
            step={0.1}
            value={minIndoorTakeoffSpacing}
            onChange={onDistanceFieldUpdated}
          />
        </Box>

        <Box display='flex' flexDirection='row' mb={1}>
          <SimpleDistanceField
            fullWidth
            name='placementAccuracy'
            label={t('settings.uavs.desiredPlacementAccuracy')}
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
            label={t('settings.uavs.desiredHeadingAccuracy')}
            min={1}
            max={45}
            step={1}
            value={takeoffHeadingAccuracy}
            onChange={onIntegerFieldUpdated}
          />
        </Box>

        <Typography variant='body2' color='textSecondary'>
          {t('settings.uavs.missionSetupDescription')}
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
  maxUploadConcurrency: PropTypes.number,
  minIndoorTakeoffSpacing: PropTypes.number,
  minOutdoorTakeoffSpacing: PropTypes.number,
  onCheckboxToggled: PropTypes.func,
  onDistanceFieldUpdated: PropTypes.func,
  onEnumFieldUpdated: PropTypes.func,
  onIntegerFieldUpdated: PropTypes.func,
  onVoltageFieldUpdated: PropTypes.func,
  placementAccuracy: PropTypes.number,
  preferredBatteryDisplayStyle: PropTypes.oneOf(batteryDisplayStyleOrder),
  t: PropTypes.func,
  takeoffHeadingAccuracy: PropTypes.number,
  uavOperationConfirmationStyle: PropTypes.oneOf(
    uavOperationConfirmationStyleOrder
  ),
  warnThreshold: PropTypes.number,
};

UAVsTabPresentation.defaultProps = {
  preferredBatteryDisplayStyle: BatteryDisplayStyle.VOLTAGE,
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.settings.uavs,
    placementAccuracy: getDesiredPlacementAccuracyInMeters(state),
    takeoffHeadingAccuracy: getDesiredTakeoffHeadingAccuracy(state),
    maxUploadConcurrency: getMaximumConcurrentUploadTaskCount(state),
    minIndoorTakeoffSpacing: getMinimumIndoorTakeoffSpacing(state),
    minOutdoorTakeoffSpacing: getMinimumOutdoorTakeoffSpacing(state),
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
)(withTranslation()(UAVsTabPresentation));
