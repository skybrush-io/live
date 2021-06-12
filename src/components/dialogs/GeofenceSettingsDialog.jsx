/**
 * @file Dialog that shows the geofence settings and allows the user to
 * edit them.
 */

import { Checkboxes, TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Form } from 'react-final-form';
import createDecorator from 'final-form-calculate';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import InputAdornment from '@material-ui/core/InputAdornment';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';
import FormHeader from '@skybrush/mui-components/lib/FormHeader';

import { forceFormSubmission } from '~/components/forms';
import {
  closeGeofenceSettingsDialog,
  updateGeofenceSettings,
} from '~/features/geofence/slice';
import {
  proposeDistanceLimit,
  proposeHeightLimit,
} from '~/features/geofence/utils';
import { hasActiveGeofencePolygon } from '~/features/mission/selectors';
import { clearGeofencePolygonId } from '~/features/mission/slice';
import { updateGeofencePolygon } from '~/features/show/actions';
import {
  getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories,
  getMaximumHeightInTrajectories,
} from '~/features/show/selectors';

import {
  createValidator,
  atLeast,
  finite,
  integer,
  required,
} from '~/utils/validation';

const validator = createValidator({
  horizontalMargin: [required, finite, atLeast(1)],
  verticalMargin: [required, finite, atLeast(1)],
  maxVertexCount: [required, integer, atLeast(3)],
});

const calculator = createDecorator(
  {
    field: 'verticalMargin',
    updates: {
      heightLimit: (margin, { maxHeight }) => {
        margin = Number.parseFloat(margin);
        return proposeHeightLimit(
          maxHeight,
          Number.isFinite(margin) ? margin : 0
        );
      },
    },
  },
  {
    field: 'horizontalMargin',
    updates: {
      distanceLimit: (margin, { maxDistance }) => {
        margin = Number.parseFloat(margin);
        return proposeDistanceLimit(
          maxDistance,
          Number.isFinite(margin) ? margin : 0
        );
      },
    },
  }
);

const GeofenceSettingsFormPresentation = ({
  initialValues,
  onKeyPress,
  onSubmit,
}) => (
  <Form
    initialValues={initialValues}
    validate={validator}
    decorators={[calculator]}
    onSubmit={onSubmit}
  >
    {({ handleSubmit, values: { simplify } }) => (
      <form
        id='geofenceSettings'
        onSubmit={handleSubmit}
        onKeyPress={onKeyPress}
      >
        <FormHeader>Safety margins</FormHeader>
        <Box display='flex' flexDirection='row'>
          <TextField
            fullWidth={false}
            name='horizontalMargin'
            label='Horizontal'
            type='number'
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            variant='filled'
          />
          <Box p={1} />
          <TextField
            fullWidth={false}
            name='verticalMargin'
            label='Vertical'
            type='number'
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            variant='filled'
          />
        </Box>
        <FormHeader>Proposed limits for current mission</FormHeader>
        <Box display='flex' flexDirection='row'>
          <TextField
            disabled
            fullWidth={false}
            name='distanceLimit'
            label='Max distance'
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            variant='standard'
          />
          <Box p={1} />
          <TextField
            disabled
            fullWidth={false}
            name='heightLimit'
            label='Max altitude'
            InputProps={{
              endAdornment: <InputAdornment position='end'>m</InputAdornment>,
            }}
            variant='standard'
          />
        </Box>

        <FormHeader>Vertex count reduction</FormHeader>
        <Box display='flex' flexDirection='column'>
          <Checkboxes
            name='simplify'
            data={{ label: 'Simplify\u00A0polygon' }}
          />
          <TextField
            fullWidth={false}
            name='maxVertexCount'
            label='Maximum vertex count'
            disabled={!simplify}
            type='number'
            variant='filled'
          />
        </Box>
      </form>
    )}
  </Form>
);

GeofenceSettingsFormPresentation.propTypes = {
  initialValues: PropTypes.object,
  onKeyPress: PropTypes.func,
  onSubmit: PropTypes.func,
};

/**
 * Container of the form that shows the fields that the user can use to
 * edit the geofence settings.
 */
const GeofenceSettingsForm = connect(
  // mapStateToProps
  (state) => ({
    initialValues: {
      ...state.dialogs.geofenceSettings,
      maxDistance:
        getMaximumHorizontalDistanceFromTakeoffPositionInTrajectories(state),
      maxHeight: getMaximumHeightInTrajectories(state),
    },
  })
)(GeofenceSettingsFormPresentation);

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the geofence settings.
 */
const GeofenceSettingsDialogPresentation = ({
  forceFormSubmission,
  hasFence,
  onClose,
  onClearGeofence,
  onSubmit,
  open,
}) => {
  const handleKeyPress = useCallback(
    (event) => {
      if (event.nativeEvent.code === 'Enter') {
        forceFormSubmission();
      }
    },
    [forceFormSubmission]
  );

  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='xs'
      title='Geofence settings'
      onClose={onClose}
    >
      <DialogContent>
        {/* <FormHeader>Automatic geofence</FormHeader> */}
        <GeofenceSettingsForm onSubmit={onSubmit} onKeyPress={handleKeyPress} />
      </DialogContent>
      <DialogActions>
        <Button
          color='secondary'
          disabled={!hasFence}
          onClick={onClearGeofence}
        >
          Clear current fence
        </Button>
        <Button color='primary' onClick={forceFormSubmission}>
          Apply
        </Button>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </DraggableDialog>
  );
};

GeofenceSettingsDialogPresentation.propTypes = {
  forceFormSubmission: PropTypes.func,
  hasFence: PropTypes.bool,
  onClearGeofence: PropTypes.func,
  onClose: PropTypes.func,
  onSubmit: PropTypes.func,
  open: PropTypes.bool.isRequired,
};

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the geofence settings.
 */
const GeofenceSettingsDialog = connect(
  // mapStateToProps
  (state) => ({
    hasFence: hasActiveGeofencePolygon(state),
    open: state.dialogs.geofenceSettings.dialogVisible,
  }),
  // mapDispatchToProps
  (dispatch) => ({
    forceFormSubmission() {
      forceFormSubmission('geofenceSettings');
    },
    onClearGeofence() {
      dispatch(clearGeofencePolygonId());
    },
    onClose() {
      dispatch(closeGeofenceSettingsDialog());
    },
    onSubmit(data) {
      dispatch(
        updateGeofenceSettings({
          horizontalMargin: Number(data.horizontalMargin),
          verticalMargin: Number(data.verticalMargin),
          simplify: data.simplify,
          maxVertexCount: Number(data.maxVertexCount),
        })
      );
      dispatch(closeGeofenceSettingsDialog());
      dispatch(updateGeofencePolygon());
    },
  })
)(GeofenceSettingsDialogPresentation);

export default GeofenceSettingsDialog;
