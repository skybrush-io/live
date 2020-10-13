import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogContent from '@material-ui/core/DialogContent';
import FormGroup from '@material-ui/core/FormGroup';
import Typography from '@material-ui/core/Typography';

import {
  setFlatEarthCoordinateSystemOrigin,
  setFlatEarthCoordinateSystemOrientation,
} from '~/actions/map-origin';
import CoordinateSystemFields from '~/components/CoordinateSystemFields';
import DialogToolbar from '~/components/dialogs/DialogToolbar';
import FormHeader from '~/components/dialogs/FormHeader';
import RTKCorrectionSourceSelector from '~/features/rtk/RTKCorrectionSourceSelector';
import { updateOutdoorShowSettings } from '~/features/show/actions';
import { COORDINATE_SYSTEM_TYPE } from '~/features/show/constants';
import { closeEnvironmentEditorDialog } from '~/features/show/slice';
import { showNotification } from '~/features/snackbar/slice';
import { MessageSemantics } from '~/features/snackbar/types';

const instructionsByType = {
  indoor:
    'This show is an indoor show. You should specify the location of the ' +
    'stage (for visualisation purposes) and the location of the flying ' +
    'arena.',
  outdoor:
    'This show is an outdoor show. You need to specify at least ' +
    'the origin and orientation of the coordinate system so Skybrush can map ' +
    'the show into GPS coordinates.',
};

const Instructions = ({ type }) => (
  <Typography variant='body1'>{instructionsByType[type]}</Typography>
);

Instructions.propTypes = {
  type: PropTypes.oneOf(Object.keys(instructionsByType)),
};

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the environment settings of a drone show.
 */
const EnvironmentEditorDialog = ({
  editing,
  onClose,
  onCopyCoordinateSystemToMap,
  onOriginChanged,
  onOrientationChanged,
  onSetCoordinateSystemFromMap,
  outdoor,
  type,
}) => (
  <Dialog fullWidth open={editing} maxWidth='sm' onClose={onClose}>
    <DialogToolbar>
      <Typography noWrap variant='subtitle1'>
        Environment settings
      </Typography>
    </DialogToolbar>
    <DialogContent>
      <Box my={2}>
        <Instructions type={type} />

        {type === 'outdoor' && (
          <>
            <FormGroup>
              <FormHeader>Coordinate system of show</FormHeader>
              <CoordinateSystemFields
                type={COORDINATE_SYSTEM_TYPE}
                {...outdoor.coordinateSystem}
                onOriginChanged={onOriginChanged}
                onOrientationChanged={onOrientationChanged}
                orientationLabel='Show orientation'
                originLabel='Show origin'
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
        )}
      </Box>
    </DialogContent>
  </Dialog>
);

EnvironmentEditorDialog.propTypes = {
  editing: PropTypes.bool,
  outdoor: PropTypes.shape({
    coordinateSystem: PropTypes.shape({
      orientation: PropTypes.string.isRequired,
      origin: PropTypes.arrayOf(PropTypes.number),
    }),
  }),
  onClose: PropTypes.func,
  onCopyCoordinateSystemToMap: PropTypes.func,
  onOriginChanged: PropTypes.func,
  onOrientationChanged: PropTypes.func,
  onSetCoordinateSystemFromMap: PropTypes.func,
  type: PropTypes.oneOf(['indoor', 'outdoor']),
};

EnvironmentEditorDialog.defaultProps = {
  editing: false,
};

export default connect(
  // mapStateToProps
  (state) => ({
    ...state.show.environment,
    mapCoordinateSystem: state.map.origin,
  }),

  // mapDispatchToProps
  (dispatch) => ({
    onClose() {
      dispatch(closeEnvironmentEditorDialog());
    },

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
          stateProps.outdoor.coordinateSystem
        ),
      onSetCoordinateSystemFromMap: () =>
        dispatchProps.onSetCoordinateSystemFromMap(
          stateProps.mapCoordinateSystem
        ),
    };

    delete mergedProps.mapCoordinateSystem;

    return mergedProps;
  }
)(EnvironmentEditorDialog);
