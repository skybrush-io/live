/**
 * @file Dialog that shows the editor for a saved location.
 */

import PropTypes from 'prop-types';
import React, { useCallback } from 'react';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import {
  LatitudeField,
  LongitudeField,
  HeadingField,
  TextField,
  forceFormSubmission,
} from '~/components/forms';
import {
  cancelLocationEditing,
  deleteSavedLocation,
  updateSavedLocation,
} from '~/features/saved-locations/actions';
import {
  getCurrentMapViewAsSavedLocation,
  getEditedLocationId,
  getEditorDialogVisibility,
} from '~/features/saved-locations/selectors';
import { shouldOptimizeUIForTouch } from '~/features/settings/selectors';
import { NEW_ITEM_ID } from '~/utils/collections';
import { between, integer, join, required } from '~/utils/validation';

const SavedLocationEditorFormPresentation = ({
  initialValues,
  onSubmit,
  optimizeUIForTouch,
}) => (
  <Form initialValues={initialValues} onSubmit={onSubmit}>
    {({ handleSubmit }) => (
      <form
        id='SavedLocationEditor'
        style={{ marginTop: 8, marginBottom: 0 }}
        onSubmit={handleSubmit}
      >
        <TextField
          fullWidth
          autoFocus={!optimizeUIForTouch}
          margin='dense'
          name='name'
          label='Name'
          fieldProps={{ validate: required }}
        />
        <Box display='flex' flexDirection='row'>
          <LatitudeField
            fullWidth
            margin='dense'
            name='center.lat'
            label='Latitude'
          />
          <Box p={0.75} />
          <LongitudeField
            fullWidth
            margin='dense'
            name='center.lon'
            label='Longitude'
          />
        </Box>
        <Box display='flex' flexDirection='row'>
          <HeadingField
            fullWidth
            margin='dense'
            name='rotation'
            label='Rotation'
          />
          <Box p={0.75} />
          <TextField
            fullWidth
            type='number'
            margin='dense'
            name='zoom'
            label='Zoom level'
            fieldProps={{
              validate: join([required, integer, between(1, 30)]),
            }}
            inputProps={{ min: 1, max: 30 }}
          />
        </Box>
        <TextField
          fullWidth
          multiline
          margin='dense'
          name='notes'
          label='Notes'
          minRows={3}
          maxRows={3}
        />
        <input hidden type='submit' />
      </form>
    )}
  </Form>
);

SavedLocationEditorFormPresentation.propTypes = {
  initialValues: PropTypes.object,
  onSubmit: PropTypes.func,
  optimizeUIForTouch: PropTypes.bool,
};

/**
 * Container of the form that shows the fields that the user can use to
 * edit the saved location.
 */
const SavedLocationEditorForm = connect(
  // mapStateToProps
  (state) => {
    const id = getEditedLocationId(state);
    const currentLocation =
      id === NEW_ITEM_ID || !(id in state.savedLocations.byId)
        ? getCurrentMapViewAsSavedLocation(state)
        : state.savedLocations.byId[id];
    return {
      initialValues: currentLocation,
      optimizeUIForTouch: shouldOptimizeUIForTouch(state),
    };
  }
)(SavedLocationEditorFormPresentation);

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the saved location.
 */
const SavedLocationEditorDialogPresentation = ({
  editedLocationId,
  onClose,
  onDelete,
  onSubmit,
  open,
}) => {
  const _forceFormSubmission = useCallback(() => {
    forceFormSubmission('SavedLocationEditor');
  }, []);

  const isNew = editedLocationId === NEW_ITEM_ID;
  const title = isNew ? 'Create new location' : 'Edit saved location';

  const actions = [
    <Button key='save' color='primary' onClick={_forceFormSubmission}>
      Save
    </Button>,
  ];

  if (isNew) {
    actions.push(
      <Button key='discard' onClick={onDelete(editedLocationId)}>
        Discard
      </Button>
    );
  } else {
    actions.push(
      <Button
        key='delete'
        color='secondary'
        onClick={onDelete(editedLocationId)}
      >
        Delete
      </Button>,
      <Button key='cancel' onClick={onClose}>
        Cancel
      </Button>
    );
  }

  return (
    <DraggableDialog
      fullWidth
      title={title}
      open={open}
      maxWidth='xs'
      onClose={onClose}
    >
      <DialogContent>
        <SavedLocationEditorForm onSubmit={onSubmit} />
      </DialogContent>
      <DialogActions>{actions}</DialogActions>
    </DraggableDialog>
  );
};

SavedLocationEditorDialogPresentation.propTypes = {
  editedLocationId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
};

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the server settings.
 */
const SavedLocationEditorDialog = connect(
  // mapStateToProps
  (state) => ({
    open: getEditorDialogVisibility(state),
    editedLocationId: getEditedLocationId(state),
  }),
  // mapDispatchToProps
  (dispatch) => ({
    onClose() {
      dispatch(cancelLocationEditing());
    },
    onDelete(id) {
      return () => {
        dispatch(cancelLocationEditing());
        dispatch(deleteSavedLocation(id));
      };
    },
    onSubmit(data) {
      const currentLocation = structuredClone(data);

      currentLocation.center.lon = Number(currentLocation.center.lon);
      currentLocation.center.lat = Number(currentLocation.center.lat);
      currentLocation.rotation = Number(currentLocation.rotation);
      currentLocation.zoom = Number(currentLocation.zoom);

      dispatch(updateSavedLocation(currentLocation));
      dispatch(cancelLocationEditing());
    },
  })
)(SavedLocationEditorDialogPresentation);

export default SavedLocationEditorDialog;
