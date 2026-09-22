import Navigation from '@mui/icons-material/Navigation';
import VerticalAlignCenter from '@mui/icons-material/VerticalAlignCenter';
import Warning from '@mui/icons-material/Warning';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import type { SelectChangeEvent } from '@mui/material/Select';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import type React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  FormHeader,
  SmallProgressIndicator,
  Tooltip,
} from '@skybrush/mui-components';
import type { Environment } from '@skybrush/show-format';

import { Colors } from '~/components/colors';
import CoordinateSystemFields from '~/components/CoordinateSystemFields';
import { SimpleDistanceField } from '~/components/forms/fields';
import { estimateShowCoordinateSystemFromActiveUAVs } from '~/features/auto-fit/actions';
import { canEstimateShowCoordinateSystemFromActiveUAVs } from '~/features/auto-fit/selectors';
import { updateFlatEarthCoordinateSystem } from '~/features/map/origin';
import RTKCorrectionSourceSelector from '~/features/rtk/RTKCorrectionSourceSelector';
import {
  setOutdoorShowAltitudeReferenceToAverageAMSL,
  setOutdoorShowAltitudeReferenceType,
  setOutdoorShowAltitudeReferenceValue,
  updateOutdoorShowSettings,
} from '~/features/show/actions';
import {
  AltitudeReference,
  DEFAULT_TAKEOFF_HEADING,
  TakeoffHeadingMode,
  type AltitudeReferenceSpecification,
  type TakeoffHeadingSpecification,
} from '~/features/show/constants';
import {
  getEnvironmentFromLoadedShowData,
  getOutdoorShowOrientation,
  getOutdoorShowTakeoffHeadingSpecification,
} from '~/features/show/selectors';
import type { OutdoorCoordinateSystem } from '~/features/show/types';
import { showSuccess } from '~/features/snackbar/actions';
import {
  getAverageHeadingOfActiveUAVs,
  selectPreTakeoffAltitudeWarningProps,
  type PreTakeoffAltitudeWarningProps,
} from '~/features/uavs/selectors';
import i18n from '~/i18n';
import AutoFix from '~/icons/AutoFix';
import { scrollToMapLocation } from '~/signals';
import type { AppDispatch, AppThunk, RootState } from '~/store/reducers';
import { formatAltitude, formatDistance } from '~/utils/formatting';
import {
  normalizeAngle,
  toLonLatFromScaledJSON,
  type LonLat,
} from '~/utils/geography';

import { TakeoffHeadingSpecEditor } from './TakeoffHeadingSpecEditor';

type Props = {
  altitudeReference?: AltitudeReferenceSpecification;
  canEstimateShowCoordinateSystem: boolean;
  environmentFromLoadedShowData?: Environment;
  estimatingCoordinateSystem: boolean;
  preTakeoffAltitudeWarning?: PreTakeoffAltitudeWarningProps;
  onAltitudeReferenceTypeChanged: (event: SelectChangeEvent) => void;
  onAltitudeReferenceValueChanged: (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  onCopyCoordinateSystemToMap: () => void;
  onEstimateShowCoordinateSystem: () => void;
  onOriginChanged: (value: LonLat) => void;
  onOrientationChanged: (value: string) => void;
  onSetAltitudeReferenceToAverageAMSL: () => void;
  onSetCoordinateSystemFromFile: () => void;
  onSetCoordinateSystemFromMap: () => void;
  onSetTakeoffHeading: (value: TakeoffHeadingSpecification) => void;
  onSetTakeoffHeadingToAverageActiveUAVHeading: () => void;
  showCoordinateSystem: OutdoorCoordinateSystem;
  takeoffHeading: TakeoffHeadingSpecification;
};

/**
 * Presentation component for the form that allows the user to edit the
 * environment of an outdoor drone show.
 */
const OutdoorEnvironmentEditor = ({
  altitudeReference,
  canEstimateShowCoordinateSystem,
  environmentFromLoadedShowData,
  estimatingCoordinateSystem,
  preTakeoffAltitudeWarning,
  onAltitudeReferenceTypeChanged,
  onAltitudeReferenceValueChanged,
  onCopyCoordinateSystemToMap,
  onEstimateShowCoordinateSystem,
  onOriginChanged,
  onOrientationChanged,
  onSetAltitudeReferenceToAverageAMSL,
  onSetCoordinateSystemFromFile,
  onSetCoordinateSystemFromMap,
  onSetTakeoffHeading,
  onSetTakeoffHeadingToAverageActiveUAVHeading,
  showCoordinateSystem,
  takeoffHeading,
}: Props) => {
  const { t } = useTranslation();
  const usingAMSLReference =
    altitudeReference && altitudeReference.type === AltitudeReference.AMSL;

  return (
    <>
      <FormHeader>{t('outdoorEnvironmentEditor.coordinateSystem')}</FormHeader>

      <Box sx={{ display: 'flex', flexDirection: 'row' }}>
        <Box>
          <CoordinateSystemFields
            {...showCoordinateSystem}
            origin={showCoordinateSystem.origin}
            orientationLabel={t('outdoorEnvironmentEditor.showOrientation')}
            originLabel={t('outdoorEnvironmentEditor.showOrigin')}
            onOriginChanged={onOriginChanged}
            onOrientationChanged={onOrientationChanged}
            onTypeChanged={undefined}
          />

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-evenly',
              alignItems: 'center',
              py: 1,
            }}
          >
            <Typography variant='button' color='textSecondary'>
              Copy coordinate system:
            </Typography>
            <Tooltip
              disabled={Boolean(environmentFromLoadedShowData?.location)}
              content={t('outdoorEnvironmentEditor.fileToShowTooltip')}
            >
              {/* NOTE: Wrapper required to show tooltip on disabled button. */}
              <span>
                <Button
                  disabled={!environmentFromLoadedShowData?.location}
                  onClick={onSetCoordinateSystemFromFile}
                >
                  {t('outdoorEnvironmentEditor.fileToShow')}
                </Button>
              </span>
            </Tooltip>
            <Button onClick={onSetCoordinateSystemFromMap}>
              {t('outdoorEnvironmentEditor.mapToShow')}
            </Button>
            <Button onClick={onCopyCoordinateSystemToMap}>
              {t('outdoorEnvironmentEditor.showToMap')}
            </Button>
          </Box>
        </Box>
        <Box sx={{ alignSelf: 'bottom', pt: 1 }}>
          <Tooltip
            content={t(
              'outdoorEnvironmentEditor.fitCoordinateSysToCurrentDrone'
            )}
          >
            <IconButton
              disabled={
                !canEstimateShowCoordinateSystem || estimatingCoordinateSystem
              }
              edge='end'
              size='large'
              onClick={onEstimateShowCoordinateSystem}
            >
              <AutoFix />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <TakeoffHeadingSpecEditor
        takeoffHeading={takeoffHeading}
        onChange={onSetTakeoffHeading}
        onSetToAverageHeading={onSetTakeoffHeadingToAverageActiveUAVHeading}
      />

      <Box sx={{ pt: 1, display: 'flex', flexDirection: 'row' }}>
        <Box style={{ color: Colors.warning }}>
          <Warning />
        </Box>
        <Box sx={{ flex: 1, pl: 1 }}>
          <Typography color='textSecondary' variant='body2'>
            <Trans
              i18nKey='outdoorEnvironmentEditor.warningText'
              components={{ underline: <u /> }}
            />
          </Typography>
        </Box>
      </Box>

      <FormHeader>{t('outdoorEnvironmentEditor.altitudeControl')}</FormHeader>

      <Box sx={{ display: 'flex', flexDirection: 'row', pb: 2 }}>
        <FormControl fullWidth variant='filled'>
          <InputLabel htmlFor='altitude-reference-type'>
            {t('outdoorEnvironmentEditor.showIsControlledBasedOn')}
          </InputLabel>
          <Select
            value={
              (altitudeReference ? altitudeReference.type : null) ||
              AltitudeReference.AHL
            }
            inputProps={{ id: 'altitude-reference-type' }}
            onChange={onAltitudeReferenceTypeChanged}
          >
            <MenuItem value={AltitudeReference.AHL}>
              {t('outdoorEnvironmentEditor.AHL')}
            </MenuItem>
            <MenuItem value={AltitudeReference.AMSL}>
              {t('outdoorEnvironmentEditor.AMSL')}
            </MenuItem>
          </Select>
        </FormControl>
        <Box sx={{ p: 1 }} />
        <SimpleDistanceField
          disabled={!usingAMSLReference}
          label={t('outdoorEnvironmentEditor.AMSLReference')}
          value={(altitudeReference ? altitudeReference.value : null) || 0}
          step={0.1}
          min={-10000}
          max={10000}
          onChange={onAltitudeReferenceValueChanged}
        />
        <Box sx={{ alignSelf: 'bottom', pt: 1 }}>
          <Tooltip content={t('outdoorEnvironmentEditor.setToAverageAMSL')}>
            <IconButton
              disabled={!usingAMSLReference}
              edge='end'
              size='large'
              onClick={onSetAltitudeReferenceToAverageAMSL}
            >
              <VerticalAlignCenter />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {preTakeoffAltitudeWarning && (
        <Alert severity='warning' sx={{ mb: 2 }}>
          {t('outdoorEnvironmentEditor.preTakeoffAltitudeWarning', {
            averageGroundAMSL: formatAltitude(
              preTakeoffAltitudeWarning.averageGroundAMSL
            ),
            amslReference: formatAltitude(
              preTakeoffAltitudeWarning.amslReference
            ),
            difference: formatDistance(preTakeoffAltitudeWarning.difference),
            sampleCount: preTakeoffAltitudeWarning.sampleCount,
            threshold: formatDistance(preTakeoffAltitudeWarning.threshold),
          })}
        </Alert>
      )}

      <RTKCorrectionSourceSelector />

      <Box sx={{ pt: 1, mb: -1 }}>
        <SmallProgressIndicator
          label='Fitting coordinate system...'
          visible={estimatingCoordinateSystem}
        />
      </Box>
    </>
  );
};

/**
 * Thunk that sets the takeoff heading specification of the show to the
 * average heading of the active UAVs.
 */
const setTakeoffHeadingToAverageActiveUAVHeading =
  (): AppThunk => (dispatch, getState) => {
    const state = getState();
    const absoluteAngle = getAverageHeadingOfActiveUAVs(state);
    if (!Number.isFinite(absoluteAngle)) {
      return;
    }

    const takeoffHeading: TakeoffHeadingSpecification = {
      ...DEFAULT_TAKEOFF_HEADING,
      ...getOutdoorShowTakeoffHeadingSpecification(state),
    };
    if (takeoffHeading.type === TakeoffHeadingMode.ABSOLUTE) {
      takeoffHeading.value = normalizeAngle(absoluteAngle);
    } else {
      const showOrientation = getOutdoorShowOrientation(state);
      takeoffHeading.type = TakeoffHeadingMode.RELATIVE;
      takeoffHeading.value = normalizeAngle(absoluteAngle - showOrientation);
    }

    dispatch(
      updateOutdoorShowSettings({
        takeoffHeading,
        setupMission: true,
      })
    );
  };

/**
 * Shows a notification with a button that navigates to the given location on
 * the map when clicked.
 */
const showNotificationWithNavigationOption =
  (message: string, location: LonLat) => (_dispatch: AppDispatch) => {
    showSuccess(message, {
      buttons: [
        {
          label: i18n.t('general.action.navigate'),
          endIcon: <Navigation />,
          action: () => scrollToMapLocation(location),
        },
      ],
      timeout: 10000,
      topic: 'coordinate-system-updated',
    });
  };

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    altitudeReference: state.show.environment.outdoor.altitudeReference,
    canEstimateShowCoordinateSystem:
      canEstimateShowCoordinateSystemFromActiveUAVs(state),
    environmentFromLoadedShowData: getEnvironmentFromLoadedShowData(state),
    estimatingCoordinateSystem: Boolean(
      state.show.environment.estimatingCoordinateSystem
    ),
    preTakeoffAltitudeWarning: selectPreTakeoffAltitudeWarningProps(state),
    showCoordinateSystem: state.show.environment.outdoor.coordinateSystem,
    mapCoordinateSystem: state.map.origin,
    takeoffHeading: getOutdoorShowTakeoffHeadingSpecification(state),
  }),

  // mapDispatchToProps
  {
    onAltitudeReferenceTypeChanged: (event: SelectChangeEvent) =>
      setOutdoorShowAltitudeReferenceType(
        event.target.value as AltitudeReference
      ),
    onAltitudeReferenceValueChanged: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => setOutdoorShowAltitudeReferenceValue(event.target.value),
    onEstimateShowCoordinateSystem: estimateShowCoordinateSystemFromActiveUAVs,

    onOrientationChanged: (value: string) =>
      updateOutdoorShowSettings({
        orientation: value,
        setupMission: true,
      }),

    onOriginChanged: (value: LonLat) =>
      updateOutdoorShowSettings({
        origin: value,
        setupMission: true,
      }),

    onSetAltitudeReferenceToAverageAMSL:
      setOutdoorShowAltitudeReferenceToAverageAMSL,

    onSetTakeoffHeading: (value: TakeoffHeadingSpecification) =>
      updateOutdoorShowSettings({
        takeoffHeading: value,
        setupMission: true,
      }),

    onSetTakeoffHeadingToAverageActiveUAVHeading:
      setTakeoffHeadingToAverageActiveUAVHeading,

    showNotificationWithNavigationOption,

    updateFlatEarthCoordinateSystem,
    updateOutdoorShowSettings,
  },

  // mergeProps
  (
    {
      environmentFromLoadedShowData,
      mapCoordinateSystem,
      showCoordinateSystem,
      ...stateProps
    },
    {
      showNotificationWithNavigationOption,
      updateFlatEarthCoordinateSystem,
      updateOutdoorShowSettings,
      ...dispatchProps
    },
    ownProps
  ) => ({
    ...ownProps,
    ...stateProps,
    ...dispatchProps,

    environmentFromLoadedShowData,
    showCoordinateSystem,

    onCopyCoordinateSystemToMap: () => {
      // NOTE: Bang justified as the origin is expected to be set for outdoor
      // shows when this button is reachable.
      updateFlatEarthCoordinateSystem({
        position: showCoordinateSystem.origin!,
        angle: showCoordinateSystem.orientation,
      });
      showNotificationWithNavigationOption(
        i18n.t('outdoorEnvironmentEditor.showCoordinateSystemAppliedToMap'),
        showCoordinateSystem.origin!
      );
    },

    onSetCoordinateSystemFromMap: () => {
      updateOutdoorShowSettings({
        origin: mapCoordinateSystem.position,
        orientation: mapCoordinateSystem.angle,
        setupMission: true,
      });

      showNotificationWithNavigationOption(
        i18n.t('outdoorEnvironmentEditor.showCoordinateSystemUpdatedFromMap'),
        mapCoordinateSystem.position
      );
    },

    onSetCoordinateSystemFromFile: () => {
      // NOTE: Bang justified as this button is only enabled when the show
      // data contains a location.
      const { origin: scaledOrigin, orientation } =
        environmentFromLoadedShowData!.location!;
      const origin = toLonLatFromScaledJSON([scaledOrigin[0], scaledOrigin[1]]);

      updateOutdoorShowSettings({ origin, orientation, setupMission: true });

      showNotificationWithNavigationOption(
        i18n.t('outdoorEnvironmentEditor.showCoordinateSystemUpdatedFromFile'),
        origin
      );
    },
  })
)(OutdoorEnvironmentEditor);
