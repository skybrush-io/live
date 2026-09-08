import Box from '@mui/material/Box';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select, { type SelectChangeEvent } from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import type { ChangeEvent, ChangeEventHandler } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles } from '@skybrush/app-theme-mui';
import { FormHeader as Header } from '@skybrush/mui-components';

import {
  SimpleAngleField,
  SimpleDistanceField,
  SimpleDurationField,
  SimpleNumericField,
  SimpleVoltageField,
} from '~/components/forms';
import { updateUAVVoltageThreshold } from '~/features/settings/actions';
import {
  getAltitudeWarningThresholdInMeters,
  getDesiredPlacementAccuracyInMeters,
  getDesiredTakeoffHeadingAccuracy,
  getMaximumConcurrentUploadTaskCount,
  getMinimumIndoorTakeoffSpacing,
  getMinimumOutdoorTakeoffSpacing,
} from '~/features/settings/selectors';
import { updateAppSettings } from '~/features/settings/slice';
import type { SettingsState } from '~/features/settings/types';
import {
  BatteryDisplayStyle,
  describeBatteryDisplayStyle,
  describeUAVOperationConfirmationStyle,
  UAVOperationConfirmationStyle,
} from '~/model/settings';
import type { AppDispatch, RootState } from '~/store/reducers';

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

const useStyles = makeStyles((theme) => ({
  gridFormControl: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    alignItems: 'center',
    flexDirection: 'row',
  },
  hidden: {
    visibility: 'hidden',
  },
  horizontalSpacer: {
    width: theme.spacing(2),
  },
}));

type Props = {
  autoRemove: boolean;
  criticalVoltageThreshold: number;
  defaultBatteryCellCount: number;
  forgetThreshold: number;
  fullChargeVoltage: number;
  goneThreshold: number;
  altitudeWarningThreshold: number;
  lowVoltageThreshold: number;
  maxUploadConcurrency: number;
  minIndoorTakeoffSpacing: number;
  minOutdoorTakeoffSpacing: number;
  onCheckboxToggled: ChangeEventHandler;
  onDistanceFieldUpdated: ChangeEventHandler;
  onEnumFieldUpdated: (event: SelectChangeEvent) => void;
  onIntegerFieldUpdated: ChangeEventHandler;
  onVoltageFieldUpdated: ChangeEventHandler;
  placementAccuracy: number;
  preferredBatteryDisplayStyle: BatteryDisplayStyle;
  takeoffHeadingAccuracy: number;
  uavOperationConfirmationStyle: UAVOperationConfirmationStyle;
  warnThreshold: number;
};

const UAVsTabPresentation = ({
  autoRemove,
  criticalVoltageThreshold,
  defaultBatteryCellCount,
  forgetThreshold,
  fullChargeVoltage,
  goneThreshold,
  altitudeWarningThreshold,
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
  preferredBatteryDisplayStyle = BatteryDisplayStyle.VOLTAGE,
  takeoffHeadingAccuracy,
  uavOperationConfirmationStyle,
  warnThreshold,
}: Props) => {
  const styles = useStyles();
  const { t } = useTranslation();
  return (
    <>
      <FormGroup sx={{ marginBottom: 2 }}>
        <FormControl className={styles.gridFormControl}>
          <FormControlLabel
            label={t('settings.uavs.warn')}
            control={<Checkbox checked className={styles.hidden} />}
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

        <FormControl className={styles.gridFormControl}>
          <FormControlLabel
            label={t('settings.uavs.gone')}
            control={<Checkbox checked className={styles.hidden} />}
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

        <FormControl className={styles.gridFormControl}>
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

      <Box sx={{ my: 2 }}>
        <Header>{t('settings.uavs.operationSettings')}</Header>

        <Box sx={{ display: 'flex', flexDirection: 'row', mb: 1 }}>
          <FormControl fullWidth variant='filled'>
            <InputLabel id='uav-operation-confirmation-style'>
              {t('settings.uavs.uavOperationConfirmations')}
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
                  {describeUAVOperationConfirmationStyle(value, t)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', mb: 1 }}>
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

      <Box sx={{ my: 2 }}>
        <Header>{t('settings.uavs.defaultBatterySettings')}</Header>

        <Box sx={{ display: 'flex', flexDirection: 'row', mb: 1 }}>
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
          <Box className={styles.horizontalSpacer} />
          <SimpleVoltageField
            fullWidth
            name='fullChargeVoltage'
            label={t('settings.uavs.fullCharge')}
            size='medium'
            min={0.1}
            max={20}
            step={0.1}
            value={fullChargeVoltage}
            onChange={onVoltageFieldUpdated}
          />
          <Box className={styles.horizontalSpacer} />
          <SimpleVoltageField
            fullWidth
            name='lowVoltageThreshold'
            label={t('settings.uavs.lowTreshold')}
            size='medium'
            min={0.1}
            max={20}
            step={0.1}
            value={lowVoltageThreshold}
            onChange={onVoltageFieldUpdated}
          />
          <Box className={styles.horizontalSpacer} />
          <SimpleVoltageField
            fullWidth
            name='criticalVoltageThreshold'
            label={t('settings.uavs.criticalTreshold')}
            size='medium'
            min={0.1}
            max={20}
            step={0.1}
            value={criticalVoltageThreshold}
            onChange={onVoltageFieldUpdated}
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'row', mb: 1 }}>
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
                  {describeBatteryDisplayStyle(value, t)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Box>
        <Header>{t('settings.uavs.missionSetup')}</Header>

        <Box sx={{ display: 'flex', flexDirection: 'row', mb: 1 }}>
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
          <Box className={styles.horizontalSpacer} />
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

        <Box sx={{ display: 'flex', flexDirection: 'row', mb: 1 }}>
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
          <Box className={styles.horizontalSpacer} />
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

        <Box sx={{ display: 'flex', flexDirection: 'row', mb: 1 }}>
          <SimpleDistanceField
            fullWidth
            name='altitudeWarningThreshold'
            label={t('settings.uavs.altitudeWarningThreshold')}
            min={0.1}
            max={100}
            step={0.1}
            value={altitudeWarningThreshold}
            onChange={onDistanceFieldUpdated}
          />
        </Box>

        <Typography variant='body2' color='textSecondary'>
          {t('settings.uavs.missionSetupDescription')}
        </Typography>
      </Box>
    </>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    ...state.settings.uavs,
    altitudeWarningThreshold: getAltitudeWarningThresholdInMeters(state),
    placementAccuracy: getDesiredPlacementAccuracyInMeters(state),
    takeoffHeadingAccuracy: getDesiredTakeoffHeadingAccuracy(state),
    maxUploadConcurrency: getMaximumConcurrentUploadTaskCount(state),
    minIndoorTakeoffSpacing: getMinimumIndoorTakeoffSpacing(state),
    minOutdoorTakeoffSpacing: getMinimumOutdoorTakeoffSpacing(state),
  }),
  // mapDispatchToProps
  (dispatch: AppDispatch) => ({
    onCheckboxToggled(event: ChangeEvent<HTMLInputElement>) {
      dispatch(
        updateAppSettings('uavs', {
          [event.target.name]: event.target.checked,
        } as Partial<SettingsState['uavs']>)
      );
    },

    onDistanceFieldUpdated(event: ChangeEvent<HTMLInputElement>) {
      // We store millimeters in the Redux store to avoid rounding errors
      const distance = Math.round(Number.parseFloat(event.target.value) * 1000);

      if (distance > 0) {
        dispatch(
          updateAppSettings('uavs', {
            [event.target.name]: distance,
          } as Partial<SettingsState['uavs']>)
        );
      }
    },

    onEnumFieldUpdated(event: SelectChangeEvent) {
      dispatch(
        updateAppSettings('uavs', {
          [event.target.name]: event.target.value,
        } as Partial<SettingsState['uavs']>)
      );
    },

    onIntegerFieldUpdated(event: ChangeEvent<HTMLInputElement>) {
      const value = Number.parseInt(event.target.value, 10);

      if (value > 0) {
        dispatch(
          updateAppSettings('uavs', {
            [event.target.name]: value,
          } as Partial<SettingsState['uavs']>)
        );
      }
    },

    onVoltageFieldUpdated(event: ChangeEvent<HTMLInputElement>) {
      const value = Number.parseFloat(event.target.value);

      if (value > 0 && Number.isFinite(value)) {
        dispatch(updateUAVVoltageThreshold(event.target.name, value));
      }
    },
  })
)(UAVsTabPresentation);
