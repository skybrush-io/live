/**
 * @file Dialog that shows the editor for a saved location.
 */

import { TextField } from 'mui-rff';
import PropTypes from 'prop-types';
import React from 'react';
import { Form } from 'react-final-form';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import { cancelLocationEditing } from '~/actions/saved-location-editor';
import { AngleField, forceFormSubmission } from '~/components/forms';
import { getCurrentMapViewAsSavedLocation } from '~/features/saved-locations/selectors';
import {
  deleteSavedLocation,
  updateSavedLocation,
} from '~/features/saved-locations/slice';
import { NEW_ITEM_ID } from '~/utils/collections';
import {
  createValidator,
  between,
  integer,
  finite,
  required,
} from '~/utils/validation';

const validator = createValidator({
  name: required,
  center: createValidator({
    lon: [required, finite, between(-90, 90)],
    lat: [required, finite, between(-180, 180)],
  }),
  rotation: [required, finite, between(0, 360)],
  zoom: [required, integer, between(1, 30)],
});

const SavedLocationEditorFormPresentation = ({
  initialValues,
  onKeyPress,
  onSubmit,
}) => (
  <Form initialValues={initialValues} validate={validator} onSubmit={onSubmit}>
    {({ handleSubmit }) => (
      <form
        id='SavedLocationEditor'
        style={{ marginTop: 8, marginBottom: 0 }}
        onSubmit={handleSubmit}
      >
        <div onKeyPress={onKeyPress}>
          <TextField
            autoFocus
            fullWidth
            margin='dense'
            name='name'
            label='Name'
            variant='filled'
          />
          <Box display='flex' flexDirection='row'>
            <TextField
              fullWidth
              margin='dense'
              name='center.lat'
              label='Latitude'
              variant='filled'
            />
            <Box p={0.75} />
            <TextField
              fullWidth
              margin='dense'
              name='center.lon'
              label='Longitude'
              variant='filled'
            />
          </Box>
          <Box display='flex' flexDirection='row'>
            <AngleField
              fullWidth
              margin='dense'
              name='rotation'
              label='Rotation'
              variant='filled'
            />
            <Box p={0.75} />
            <TextField
              fullWidth
              margin='dense'
              name='zoom'
              label='Zoom level'
              variant='filled'
            />
          </Box>
          <TextField
            autoFocus
            fullWidth
            multiline
            margin='dense'
            name='notes'
            label='Notes'
            variant='filled'
            minRows={3}
            maxRows={3}
          />
        </div>
      </form>
    )}
  </Form>
);

SavedLocationEditorFormPresentation.propTypes = {
  initialValues: PropTypes.object,
  onKeyPress: PropTypes.func,
  onSubmit: PropTypes.func,
};

/**
 * Container of the form that shows the fields that the user can use to
 * edit the saved location.
 */
const SavedLocationEditorForm = connect(
  // mapStateToProps
  (state) => {
    const id = state.dialogs.savedLocationEditor.editedLocationId;
    const currentLocation =
      id === NEW_ITEM_ID
        ? getCurrentMapViewAsSavedLocation(state)
        : state.savedLocations.byId[id];
    return { initialValues: currentLocation };
  }
)(SavedLocationEditorFormPresentation);

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the saved location.
 */
class SavedLocationEditorDialogPresentation extends React.Component {
  static propTypes = {
    editedLocationId: PropTypes.string,
    onClose: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    open: PropTypes.bool.isRequired,
  };

  constructor() {
    super();

    this.currentLocation = {};
  }

  _forceFormSubmission = () => {
    forceFormSubmission('SavedLocationEditor');
  };

  _handleKeyPress = (event) => {
    if (event.nativeEvent.code === 'Enter') {
      this.handleSubmit();
    }
  };

  render() {
    const { editedLocationId, onClose, onDelete, onSubmit, open } = this.props;
    const isNew = editedLocationId === NEW_ITEM_ID;
    const title = isNew ? 'Create new location' : 'Edit saved location';

    const actions = [
      <Button key='save' color='primary' onClick={this._forceFormSubmission}>
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
          <SavedLocationEditorForm
            onSubmit={onSubmit}
            onKeyPress={this._handleKeyPress}
          />
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </DraggableDialog>
    );
  }
}

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the server settings.
 */
const SavedLocationEditorDialog = connect(
  // mapStateToProps
  (state) => ({
    open: state.dialogs.savedLocationEditor.dialogVisible,
    editedLocationId: state.dialogs.savedLocationEditor.editedLocationId,
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
      const currentLocation = JSON.parse(JSON.stringify(data));

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
