import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import FormControl from '@mui/material/FormControl';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
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
  getDesiredPlacementAccuracyInMeters,
  getDesiredTakeoffHeadingAccuracy,
  getMaximumConcurrentUploadTaskCount,
  getMinimumIndoorTakeoffSpacing,
  getMinimumOutdoorTakeoffSpacing,
} from '~/features/settings/selectors';
import { updateAppSettings } from '~/features/settings/slice';
import { RCOvertakeInputSource } from '~/features/settings/types';
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

const rcOvertakeInputSourceOrder = [
  RCOvertakeInputSource.GAMEPAD,
  RCOvertakeInputSource.SERIAL,
];

const describeRCOvertakeInputSource = (value) => {
  switch (value) {
    case RCOvertakeInputSource.SERIAL:
      return 'COM port';

    case RCOvertakeInputSource.GAMEPAD:
    default:
      return 'USB joystick';
  }
};

const formatSerialPortLabel = (info = {}) => {
  const vendorId = info.usbVendorId;
  const productId = info.usbProductId;

  if (vendorId || productId) {
    return `USB ${vendorId ?? '?'}:${productId ?? '?'}`;
  }

  return 'Selected COM port';
};

const formatRCChannelList = (channels = [1, 2, 3, 4]) =>
  channels.join(', ');

const parseRCChannelList = (value) => {
  const channels = String(value)
    .split(/[,\s;]+/)
    .map((part) => Number.parseInt(part, 10))
    .filter((channel) => Number.isInteger(channel));
  const uniqueChannels = [];

  for (const channel of channels) {
    if (
      channel >= 1 &&
      channel <= 18 &&
      !uniqueChannels.includes(channel)
    ) {
      uniqueChannels.push(channel);
    }
  }

  return uniqueChannels.length > 0 ? uniqueChannels : [1, 2, 3, 4];
};

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
  onRCChannelListUpdated,
  onSelectRCSerialPort,
  onVoltageFieldUpdated,
  placementAccuracy,
  preferredBatteryDisplayStyle = BatteryDisplayStyle.VOLTAGE,
  rcOvertakeGamepadChannels = [1, 2, 3, 4],
  rcOvertakeInputSource = RCOvertakeInputSource.GAMEPAD,
  rcOvertakeSerialBaudRate = 115200,
  rcOvertakeSerialPortLabel,
  takeoffHeadingAccuracy,
  uavOperationConfirmationStyle,
  warnThreshold,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [rcChannelListText, setRCChannelListText] = useState(
    formatRCChannelList(rcOvertakeGamepadChannels)
  );

  useEffect(() => {
    setRCChannelListText(formatRCChannelList(rcOvertakeGamepadChannels));
  }, [rcOvertakeGamepadChannels]);

  const commitRCChannelListText = () => {
    const parsedChannels = parseRCChannelList(rcChannelListText);
    setRCChannelListText(formatRCChannelList(parsedChannels));
    onRCChannelListUpdated(parsedChannels);
  };

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

        <Box sx={{ display: 'flex', flexDirection: 'row', mb: 1 }}>
          <FormControl fullWidth variant='filled'>
            <InputLabel id='rc-overtake-input-source'>
              RC overtake input
            </InputLabel>
            <Select
              labelId='rc-overtake-input-source'
              name='rcOvertakeInputSource'
              value={rcOvertakeInputSource}
              onChange={onEnumFieldUpdated}
            >
              {rcOvertakeInputSourceOrder.map((value) => (
                <MenuItem key={value} value={value}>
                  {describeRCOvertakeInputSource(value)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {rcOvertakeInputSource === RCOvertakeInputSource.SERIAL && (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'row', mb: 1 }}>
              <SimpleNumericField
                fullWidth
                label='RC serial baud rate'
                name='rcOvertakeSerialBaudRate'
                min={1200}
                max={921600}
                step={1}
                value={rcOvertakeSerialBaudRate}
                onChange={onIntegerFieldUpdated}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                mb: 1,
              }}
            >
              <Button variant='outlined' onClick={onSelectRCSerialPort}>
                Select COM port
              </Button>
              <Typography sx={{ ml: 2 }} variant='body2' color='textSecondary'>
                {rcOvertakeSerialPortLabel ?? 'No COM port selected'}
              </Typography>
            </Box>
          </>
        )}

        {rcOvertakeInputSource === RCOvertakeInputSource.GAMEPAD && (
          <Box sx={{ display: 'flex', flexDirection: 'row', mb: 1 }}>
            <TextField
              fullWidth
              helperText='Comma-separated MAVLink RC channels; axes are mapped in this order'
              label='RC channels to send'
              name='rcOvertakeGamepadChannels'
              value={rcChannelListText}
              variant='filled'
              onBlur={commitRCChannelListText}
              onChange={(event) => setRCChannelListText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  commitRCChannelListText();
                }
              }}
            />
          </Box>
        )}
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
  onRCChannelListUpdated: PropTypes.func,
  onSelectRCSerialPort: PropTypes.func,
  onVoltageFieldUpdated: PropTypes.func,
  placementAccuracy: PropTypes.number,
  preferredBatteryDisplayStyle: PropTypes.oneOf(batteryDisplayStyleOrder),
  rcOvertakeGamepadChannels: PropTypes.arrayOf(PropTypes.number),
  rcOvertakeInputSource: PropTypes.oneOf(rcOvertakeInputSourceOrder),
  rcOvertakeSerialBaudRate: PropTypes.number,
  rcOvertakeSerialPortLabel: PropTypes.string,

  takeoffHeadingAccuracy: PropTypes.number,
  uavOperationConfirmationStyle: PropTypes.oneOf(
    uavOperationConfirmationStyleOrder
  ),
  warnThreshold: PropTypes.number,
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

    onRCChannelListUpdated(channels) {
      dispatch(
        updateAppSettings('uavs', {
          rcOvertakeGamepadChannels: channels,
        })
      );
    },

    async onSelectRCSerialPort() {
      const serial = navigator.serial || navigator.webkitSerial;

      if (!serial?.requestPort) {
        window.alert(
          'Web Serial is not available in this browser. Use Chrome or Edge on localhost/HTTPS.'
        );
        return;
      }

      try {
        const port = await serial.requestPort();
        const info = port.getInfo ? port.getInfo() : {};

        dispatch(
          updateAppSettings('uavs', {
            rcOvertakeInputSource: RCOvertakeInputSource.SERIAL,
            rcOvertakeSerialUsbVendorId: info.usbVendorId,
            rcOvertakeSerialUsbProductId: info.usbProductId,
            rcOvertakeSerialPortLabel: formatSerialPortLabel(info),
          })
        );
      } catch (error) {
        if (error?.name !== 'NotFoundError') {
          console.error(error);
        }
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
