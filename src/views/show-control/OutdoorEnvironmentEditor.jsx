import Navigation from '@mui/icons-material/Navigation';
import VerticalAlignCenter from '@mui/icons-material/VerticalAlignCenter';
import Warning from '@mui/icons-material/Warning';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import Typography from '@mui/material/Typography';
import PropTypes from 'prop-types';
import React from 'react';
import { Trans, withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  FormHeader,
  SmallProgressIndicator,
  Tooltip,
} from '@skybrush/mui-components';
import { COORDINATE_SYSTEM_TYPE } from '@skybrush/show-format';

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
} from '~/features/show/constants';
import {
  getEnvironmentFromLoadedShowData,
  getOutdoorShowOrientation,
  getOutdoorShowTakeoffHeadingSpecification,
} from '~/features/show/selectors';
import { showNotification } from '~/features/snackbar/actions';
import { MessageSemantics } from '~/features/snackbar/types';
import { getAverageHeadingOfActiveUAVs } from '~/features/uavs/selectors';
import i18n from '~/i18n';
import AutoFix from '~/icons/AutoFix';
import { scrollToMapLocation } from '~/signals';
import { normalizeAngle, toLonLatFromScaledJSON } from '~/utils/geography';

import { TakeoffHeadingSpecEditor } from './TakeoffHeadingSpecEditor';

/**
 * Presentation component for the form that allows the user to edit the
 * environment of an outdoor drone show.
 */
const OutdoorEnvironmentEditor = ({
  altitudeReference,
  canEstimateShowCoordinateSystem,
  environmentFromLoadedShowData,
  estimatingCoordinateSystem,
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
  t,
  takeoffHeading,
}) => {
  const usingAMSLReference =
    altitudeReference && altitudeReference.type === AltitudeReference.AMSL;

  return (
    <>
      <FormHeader>{t('outdoorEnvironmentEditor.coordinateSystem')}</FormHeader>

      <Box sx={{ display: 'flex', flexDirection: 'row' }}>
        <Box>
          <CoordinateSystemFields
            type={COORDINATE_SYSTEM_TYPE}
            {...showCoordinateSystem}
            orientationLabel={t('outdoorEnvironmentEditor.showOrientation')}
            originLabel={t('outdoorEnvironmentEditor.showOrigin')}
            onOriginChanged={onOriginChanged}
            onOrientationChanged={onOrientationChanged}
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
              disabled={environmentFromLoadedShowData?.location}
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

OutdoorEnvironmentEditor.propTypes = {
  altitudeReference: PropTypes.shape({
    type: PropTypes.oneOf(Object.values(AltitudeReference)),
    value: PropTypes.number,
  }),
  canEstimateShowCoordinateSystem: PropTypes.bool,
  environmentFromLoadedShowData: PropTypes.object,
  estimatingCoordinateSystem: PropTypes.bool,
  onAltitudeReferenceTypeChanged: PropTypes.func,
  onAltitudeReferenceValueChanged: PropTypes.func,
  onCopyCoordinateSystemToMap: PropTypes.func,
  onEstimateShowCoordinateSystem: PropTypes.func,
  onOriginChanged: PropTypes.func,
  onOrientationChanged: PropTypes.func,
  onSetAltitudeReferenceToAverageAMSL: PropTypes.func,
  onSetCoordinateSystemFromFile: PropTypes.func,
  onSetCoordinateSystemFromMap: PropTypes.func,
  onSetTakeoffHeading: PropTypes.func,
  onSetTakeoffHeadingToAverageActiveUAVHeading: PropTypes.func,
  showCoordinateSystem: PropTypes.shape({
    orientation: PropTypes.string.isRequired,
    origin: PropTypes.arrayOf(PropTypes.number),
  }),
  t: PropTypes.func,
  takeoffHeading: PropTypes.shape({
    type: PropTypes.oneOf(Object.values(TakeoffHeadingMode)),
    value: PropTypes.string.isRequired,
  }),
};

export default connect(
  // mapStateToProps
  (state) => ({
    altitudeReference: state.show.environment.outdoor.altitudeReference,
    canEstimateShowCoordinateSystem:
      canEstimateShowCoordinateSystemFromActiveUAVs(state),
    environmentFromLoadedShowData: getEnvironmentFromLoadedShowData(state),
    estimatingCoordinateSystem: Boolean(
      state.show.environment.estimatingCoordinateSystem
    ),
    showCoordinateSystem: state.show.environment.outdoor.coordinateSystem,
    mapCoordinateSystem: state.map.origin,
    takeoffHeading: getOutdoorShowTakeoffHeadingSpecification(state),
  }),

  // mapDispatchToProps
  {
    onAltitudeReferenceTypeChanged: (event) =>
      setOutdoorShowAltitudeReferenceType(event.target.value),
    onAltitudeReferenceValueChanged: (event) =>
      setOutdoorShowAltitudeReferenceValue(event.target.value),
    onEstimateShowCoordinateSystem: estimateShowCoordinateSystemFromActiveUAVs,

    onOrientationChanged: (value) =>
      updateOutdoorShowSettings({
        orientation: value,
        setupMission: true,
      }),

    onOriginChanged: (value) =>
      updateOutdoorShowSettings({
        origin: value,
        setupMission: true,
      }),

    onSetAltitudeReferenceToAverageAMSL:
      setOutdoorShowAltitudeReferenceToAverageAMSL,

    onSetTakeoffHeading: (value) =>
      updateOutdoorShowSettings({
        takeoffHeading: value,
        setupMission: true,
      }),

    onSetTakeoffHeadingToAverageActiveUAVHeading:
      () => (dispatch, getState) => {
        const state = getState();
        const absoluteAngle = getAverageHeadingOfActiveUAVs(state);
        if (!Number.isFinite(absoluteAngle)) {
          return;
        }

        const takeoffHeading = {
          ...DEFAULT_TAKEOFF_HEADING,
          ...getOutdoorShowTakeoffHeadingSpecification(state),
        };
        if (takeoffHeading?.type === TakeoffHeadingMode.ABSOLUTE) {
          takeoffHeading.value = normalizeAngle(absoluteAngle);
        } else {
          const showOrientation = getOutdoorShowOrientation(state);
          takeoffHeading.type = TakeoffHeadingMode.RELATIVE;
          takeoffHeading.value = normalizeAngle(
            absoluteAngle - showOrientation
          );
        }

        dispatch(
          updateOutdoorShowSettings({
            takeoffHeading,
            setupMission: true,
          })
        );
      },

    showNotificationWithNavigationOption: (message, location) => (dispatch) => {
      dispatch(
        showNotification({
          message,
          semantics: MessageSemantics.SUCCESS,
          buttons: [
            {
              label: i18n.t('general.action.navigate', 'Navigate'),
              endIcon: <Navigation />,
              action: () => scrollToMapLocation(location),
            },
          ],
          timeout: 10000,
          topic: 'coordinate-system-updated',
        })
      );
    },

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
      updateFlatEarthCoordinateSystem({
        position: showCoordinateSystem.origin,
        angle: showCoordinateSystem.orientation,
      });
      showNotificationWithNavigationOption(
        i18n.t('outdoorEnvironmentEditor.showCoordinateSystemAppliedToMap'),
        showCoordinateSystem.origin
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
      const { origin: scaledOrigin, orientation } =
        environmentFromLoadedShowData.location;
      const origin = toLonLatFromScaledJSON(scaledOrigin);

      updateOutdoorShowSettings({ origin, orientation, setupMission: true });

      showNotificationWithNavigationOption(
        i18n.t('outdoorEnvironmentEditor.showCoordinateSystemUpdatedFromFile'),
        origin
      );
    },
  })
)(withTranslation()(OutdoorEnvironmentEditor));
