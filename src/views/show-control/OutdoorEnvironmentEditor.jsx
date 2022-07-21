import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormControl from '@material-ui/core/FormControl';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import VerticalAlignCenter from '@material-ui/icons/VerticalAlignCenter';

import Tooltip from '@skybrush/mui-components/lib/Tooltip';

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
  ALTITUDE_REFERENCE,
  COORDINATE_SYSTEM_TYPE,
} from '~/features/show/constants';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';
import AutoFix from '~/icons/AutoFix';

/**
 * Presentation component for the form that allows the user to edit the
 * environment of an outdoor drone show.
 */
const OutdoorEnvironmentEditor = ({
  altitudeReference,
  canEstimateShowCoordinateSystem,
  onAltitudeReferenceTypeChanged,
  onAltitudeReferenceValueChanged,
  onCopyCoordinateSystemToMap,
  onEstimateShowCoordinateSystem,
  onOriginChanged,
  onOrientationChanged,
  onSetAltitudeReferenceToAverageAMSL,
  onSetCoordinateSystemFromMap,
  showCoordinateSystem,
}) => {
  const usingAMSLReference =
    altitudeReference && altitudeReference.type === ALTITUDE_REFERENCE.AMSL;

  return (
    <>
      <Box display='flex' flexDirection='row' pt={2}>
        <Box>
          <CoordinateSystemFields
            type={COORDINATE_SYSTEM_TYPE}
            {...showCoordinateSystem}
            orientationLabel='Show orientation'
            originLabel='Show origin'
            onOriginChanged={onOriginChanged}
            onOrientationChanged={onOrientationChanged}
          />

          <Box display='flex' justifyContent='space-evenly' py={1}>
            <Button onClick={onSetCoordinateSystemFromMap}>
              Copy map origin to show origin
            </Button>
            <Button onClick={onCopyCoordinateSystemToMap}>
              Copy show origin to map origin
            </Button>
          </Box>
        </Box>
        <Box alignSelf='bottom' pt={1}>
          <Tooltip content='Fit coordinate system to current drone positions'>
            <IconButton
              disabled={!canEstimateShowCoordinateSystem}
              edge='end'
              onClick={onEstimateShowCoordinateSystem}
            >
              <AutoFix />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Box display='flex' flexDirection='row' pt={1} pb={2}>
        <FormControl fullWidth variant='filled'>
          <InputLabel htmlFor='altitude-reference-type'>
            Show is controlled based on...
          </InputLabel>
          <Select
            value={
              (altitudeReference ? altitudeReference.type : null) ||
              ALTITUDE_REFERENCE.AGL
            }
            inputProps={{ id: 'altitude-reference-type' }}
            onChange={onAltitudeReferenceTypeChanged}
          >
            <MenuItem value={ALTITUDE_REFERENCE.AGL}>
              Altitude above ground level (AGL)
            </MenuItem>
            <MenuItem value={ALTITUDE_REFERENCE.AMSL}>
              Altitude above mean sea level (AMSL)
            </MenuItem>
          </Select>
        </FormControl>
        <Box p={1} />
        <SimpleDistanceField
          disabled={!usingAMSLReference}
          label='AMSL reference'
          value={(altitudeReference ? altitudeReference.value : null) || 0}
          step={0.1}
          min={-10000}
          max={10000}
          onChange={onAltitudeReferenceValueChanged}
        />
        <Box alignSelf='bottom' pt={1}>
          <Tooltip content='Set to average AMSL of active drones'>
            <IconButton
              disabled={!usingAMSLReference}
              edge='end'
              onClick={onSetAltitudeReferenceToAverageAMSL}
            >
              <VerticalAlignCenter />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <RTKCorrectionSourceSelector />
    </>
  );
};

OutdoorEnvironmentEditor.propTypes = {
  altitudeReference: PropTypes.shape({
    type: PropTypes.oneOf(Object.values(ALTITUDE_REFERENCE)),
    value: PropTypes.number,
  }),
  canEstimateShowCoordinateSystem: PropTypes.bool,
  onAltitudeReferenceTypeChanged: PropTypes.func,
  onAltitudeReferenceValueChanged: PropTypes.func,
  onCopyCoordinateSystemToMap: PropTypes.func,
  onEstimateShowCoordinateSystem: PropTypes.func,
  onOriginChanged: PropTypes.func,
  onOrientationChanged: PropTypes.func,
  onSetAltitudeReferenceToAverageAMSL: PropTypes.func,
  onSetCoordinateSystemFromMap: PropTypes.func,
  showCoordinateSystem: PropTypes.shape({
    orientation: PropTypes.string.isRequired,
    origin: PropTypes.arrayOf(PropTypes.number),
  }),
};

export default connect(
  // mapStateToProps
  (state) => ({
    altitudeReference: state.show.environment.outdoor.altitudeReference,
    canEstimateShowCoordinateSystem:
      canEstimateShowCoordinateSystemFromActiveUAVs(state),
    showCoordinateSystem: state.show.environment.outdoor.coordinateSystem,
    mapCoordinateSystem: state.map.origin,
  }),

  // mapDispatchToProps
  {
    onAltitudeReferenceTypeChanged: (event) =>
      setOutdoorShowAltitudeReferenceType(event.target.value),
    onAltitudeReferenceValueChanged: (event) =>
      setOutdoorShowAltitudeReferenceValue(event.target.value),
    onCopyCoordinateSystemToMap: (showCoordinateSystem) => (dispatch) => {
      dispatch(
        updateFlatEarthCoordinateSystem({
          position: showCoordinateSystem.origin,
          angle: showCoordinateSystem.orientation,
        })
      );
      dispatch(
        showNotification({
          message: 'Show coordinate system applied to map.',
          semantics: MessageSemantics.SUCCESS,
        })
      );
    },
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

    onSetCoordinateSystemFromMap: (mapCoordinateSystem) => (dispatch) => {
      dispatch(
        updateOutdoorShowSettings({
          origin: mapCoordinateSystem.position,
          orientation: mapCoordinateSystem.angle,
          setupMission: true,
        })
      );
      dispatch(
        showNotification({
          message: 'Show coordinate system updated from map.',
          semantics: MessageSemantics.SUCCESS,
        })
      );
    },
  },

  // mergeProps
  (stateProps, dispatchProps, ownProps) => {
    const mergedProps = {
      ...ownProps,
      ...stateProps,
      ...dispatchProps,
      onCopyCoordinateSystemToMap: () =>
        dispatchProps.onCopyCoordinateSystemToMap(
          stateProps.showCoordinateSystem
        ),
      onSetCoordinateSystemFromMap: () =>
        dispatchProps.onSetCoordinateSystemFromMap(
          stateProps.mapCoordinateSystem
        ),
    };

    delete mergedProps.mapCoordinateSystem;

    return mergedProps;
  }
)(OutdoorEnvironmentEditor);
