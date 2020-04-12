/**
 * @file Dialog that shows the editor for a saved location.
 */

import PropTypes from 'prop-types';
import React from 'react';
import { Form, Field } from 'react-final-form';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogTitle from '@material-ui/core/DialogTitle';

import { cancelLocationEditing } from '~/actions/saved-location-editor';
import {
  deleteSavedLocation,
  updateSavedLocation
} from '~/features/saved-locations/slice';
import { getMapViewRotationAngle } from '~/selectors/map';
import { forceFormSubmission, TextField } from '~/components/forms';
import { NEW_ITEM_ID } from '~/utils/collections';
import {
  createValidator,
  between,
  integer,
  finite,
  required
} from '~/utils/validation';

const validator = createValidator({
  name: required,
  center: createValidator({
    lon: [required, finite, between(-90, 90)],
    lat: [required, finite, between(-180, 180)]
  }),
  rotation: [required, finite, between(0, 360)],
  zoom: [required, integer, between(1, 30)]
});

const SavedLocationEditorFormPresentation = ({
  initialValues,
  onKeyPress,
  onSubmit
}) => (
  <Form initialValues={initialValues} validate={validator} onSubmit={onSubmit}>
    {({ handleSubmit }) => (
      <form id="SavedLocationEditor" onSubmit={handleSubmit}>
        <div onKeyPress={onKeyPress}>
          <Field
            autoFocus
            fullWidth
            margin="normal"
            name="name"
            component={TextField}
            label="Name"
          />
          <Field
            fullWidth
            margin="normal"
            name="center.lon"
            component={TextField}
            label="Longitude"
          />
          <Field
            fullWidth
            margin="normal"
            name="center.lat"
            component={TextField}
            label="Latitude"
          />
          <Field
            fullWidth
            margin="normal"
            name="rotation"
            component={TextField}
            label="Rotation"
          />
          <Field
            fullWidth
            margin="normal"
            name="zoom"
            component={TextField}
            label="Zoom level"
          />
        </div>
      </form>
    )}
  </Form>
);

SavedLocationEditorFormPresentation.propTypes = {
  initialValues: PropTypes.object,
  onKeyPress: PropTypes.func,
  onSubmit: PropTypes.func
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
        ? {
            center: {
              lon: state.map.view.position[0].toFixed(6),
              lat: state.map.view.position[1].toFixed(6)
            },
            rotation: getMapViewRotationAngle(state),
            zoom: Math.round(state.map.view.zoom)
          }
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
    open: PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);

    this.currentLocation = {};
  }

  _forceFormSubmission = () => {
    forceFormSubmission('SavedLocationEditor');
  };

  _handleKeyPress = (e) => {
    if (e.nativeEvent.code === 'Enter') {
      this.handleSubmit();
    }
  };

  render() {
    const { editedLocationId, onClose, onDelete, onSubmit, open } = this.props;
    const isNew = editedLocationId === NEW_ITEM_ID;
    const title = isNew ? 'Create new location' : 'Edit saved location';

    const actions = [
      <Button key="save" color="primary" onClick={this._forceFormSubmission}>
        Save
      </Button>
    ];

    if (isNew) {
      actions.push(
        <Button key="discard" onClick={onDelete(editedLocationId)}>
          Discard
        </Button>
      );
    } else {
      actions.push(
        <Button
          key="delete"
          color="secondary"
          onClick={onDelete(editedLocationId)}
        >
          Delete
        </Button>,
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>
      );
    }

    return (
      <Dialog fullWidth open={open} maxWidth="sm" onClose={onClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <SavedLocationEditorForm
            onSubmit={onSubmit}
            onKeyPress={this._handleKeyPress}
          />
        </DialogContent>
        <DialogActions>{actions}</DialogActions>
      </Dialog>
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
    editedLocationId: state.dialogs.savedLocationEditor.editedLocationId
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
    }
  })
)(SavedLocationEditorDialogPresentation);

export default SavedLocationEditorDialog;
