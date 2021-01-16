import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import FormGroup from '@material-ui/core/FormGroup';

import {
  setFlatEarthCoordinateSystemOrigin,
  setFlatEarthCoordinateSystemOrientation,
} from '~/actions/map-origin';
import CoordinateSystemFields from '~/components/CoordinateSystemFields';
import FormHeader from '~/components/dialogs/FormHeader';
import RTKCorrectionSourceSelector from '~/features/rtk/RTKCorrectionSourceSelector';
import { updateOutdoorShowSettings } from '~/features/show/actions';
import { COORDINATE_SYSTEM_TYPE } from '~/features/show/constants';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';

/**
 * Presentation component for the form that allows the user to edit the
 * environment of an outdoor drone show.
 */
const OutdoorEnvironmentEditor = ({
  onCopyCoordinateSystemToMap,
  onOriginChanged,
  onOrientationChanged,
  onSetCoordinateSystemFromMap,
  showCoordinateSystem,
}) => (
  <>
    <FormGroup>
      <FormHeader>Coordinate system of show</FormHeader>
      <CoordinateSystemFields
        type={COORDINATE_SYSTEM_TYPE}
        {...showCoordinateSystem}
        orientationLabel='Show orientation'
        originLabel='Show origin'
        onOriginChanged={onOriginChanged}
        onOrientationChanged={onOrientationChanged}
      />
    </FormGroup>

    <Box display='flex' justifyContent='space-evenly' py={1}>
      <Button onClick={onSetCoordinateSystemFromMap}>
        Copy map origin to show origin
      </Button>
      <Button onClick={onCopyCoordinateSystemToMap}>
        Copy show origin to map origin
      </Button>
    </Box>

    <RTKCorrectionSourceSelector />
  </>
);

OutdoorEnvironmentEditor.propTypes = {
  onCopyCoordinateSystemToMap: PropTypes.func,
  onOriginChanged: PropTypes.func,
  onOrientationChanged: PropTypes.func,
  onSetCoordinateSystemFromMap: PropTypes.func,
  showCoordinateSystem: PropTypes.shape({
    orientation: PropTypes.string.isRequired,
    origin: PropTypes.arrayOf(PropTypes.number),
  }),
};

export default connect(
  // mapStateToProps
  (state) => ({
    showCoordinateSystem: state.show.environment.outdoor.coordinateSystem,
    mapCoordinateSystem: state.map.origin,
  }),

  // mapDispatchToProps
  (dispatch) => ({
    onCopyCoordinateSystemToMap(showCoordinateSystem) {
      dispatch(setFlatEarthCoordinateSystemOrigin(showCoordinateSystem.origin));
      dispatch(
        setFlatEarthCoordinateSystemOrientation(
          showCoordinateSystem.orientation
        )
      );
      dispatch(
        showNotification({
          message: 'Show coordinate system applied to map.',
          semantics: MessageSemantics.SUCCESS,
        })
      );
    },

    onOrientationChanged(value) {
      dispatch(
        updateOutdoorShowSettings({
          orientation: value,
          setupMission: true,
        })
      );
    },

    onOriginChanged(value) {
      dispatch(
        updateOutdoorShowSettings({
          origin: value,
          setupMission: true,
        })
      );
    },

    onSetCoordinateSystemFromMap(mapCoordinateSystem) {
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
  }),
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
