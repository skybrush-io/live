/**
 * @file Dialog that shows the editor for a saved location.
 */

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import PropTypes from 'prop-types';
import React, { useCallback, useRef } from 'react';
import { Form } from 'react-final-form';
import { Translation, withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import DraggableDialog from '@skybrush/mui-components/lib/DraggableDialog';

import {
  HeadingField,
  LatitudeField,
  LongitudeField,
  TextField,
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

const SavedLocationEditorFormPresentation = React.forwardRef(
  ({ initialValues, onSubmit, optimizeUIForTouch }, ref) => (
    <Translation>
      {(t) => (
        <Form initialValues={initialValues} onSubmit={onSubmit}>
          {({ form, handleSubmit }) => {
            ref.current = form;

            return (
              <form
                id='SavedLocationEditor'
                style={{ marginTop: 8, marginBottom: 0 }}
                onSubmit={handleSubmit}
              >
                <TextField
                  autoFocus={!optimizeUIForTouch}
                  fullWidth
                  size='small'
                  name='name'
                  label={t('savedLocationEditor.name')}
                  fieldProps={{ validate: required }}
                />
                <Box display='flex' flexDirection='row'>
                  <LatitudeField
                    fullWidth
                    size='small'
                    name='center.lat'
                    label={t('general.geography.latitude')}
                  />
                  <Box p={0.75} />
                  <LongitudeField
                    fullWidth
                    size='small'
                    name='center.lon'
                    label={t('general.geography.longitude')}
                  />
                </Box>
                <Box display='flex' flexDirection='row'>
                  <HeadingField
                    fullWidth
                    size='small'
                    name='rotation'
                    label={t('general.geometry.rotation')}
                  />
                  <Box p={0.75} />
                  <TextField
                    fullWidth
                    type='number'
                    size='small'
                    name='zoom'
                    label={t('savedLocationEditor.zoomLevel')}
                    fieldProps={{
                      validate: join([required, integer, between(1, 30)]),
                    }}
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Box>
                <TextField
                  fullWidth
                  multiline
                  size='small'
                  name='notes'
                  label={t('savedLocationEditor.notes')}
                  minRows={3}
                  maxRows={3}
                />
                <input hidden type='submit' />
              </form>
            );
          }}
        </Form>
      )}
    </Translation>
  )
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
  },
  null,
  null,
  { forwardRef: true }
)(SavedLocationEditorFormPresentation);

/**
 * Presentation component for the dialog that shows the form that the user
 * can use to edit the saved location.
 */
const SavedLocationEditorDialogPresentation = ({
  currentMapViewAsSavedLocation,
  editedLocationId,
  onClose,
  onDelete,
  onSubmit,
  open,
  t,
}) => {
  const form = useRef(null);

  const copyFromMapView = useCallback(() => {
    form.current.initialize({
      ...form.current.getState().values,
      ...currentMapViewAsSavedLocation,
    });
  }, [currentMapViewAsSavedLocation]);

  const submit = useCallback(() => {
    form.current.submit();
  }, []);

  const isNew = editedLocationId === NEW_ITEM_ID;
  const title = isNew
    ? t('savedLocationEditor.createNew')
    : t('savedLocationEditor.editSaved');

  const actions = [];

  if (!isNew) {
    actions.push(
      <Button
        key='copy-from-map-view'
        style={{ marginRight: 'auto' }}
        onClick={copyFromMapView}
      >
        {t('savedLocationEditor.copyFromMapView')}
      </Button>
    );
  }

  actions.push(
    <Button key='save' color='primary' onClick={submit}>
      {t('general.action.save')}
    </Button>
  );

  if (isNew) {
    actions.push(
      <Button key='discard' onClick={onDelete(editedLocationId)}>
        {t('general.action.discard')}
      </Button>
    );
  } else {
    actions.push(
      <Button
        key='delete'
        color='secondary'
        onClick={onDelete(editedLocationId)}
      >
        {t('general.action.delete')}
      </Button>,
      <Button key='cancel' onClick={onClose}>
        {t('general.action.cancel')}
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
        <SavedLocationEditorForm ref={form} onSubmit={onSubmit} />
      </DialogContent>
      <DialogActions>{actions}</DialogActions>
    </DraggableDialog>
  );
};

SavedLocationEditorDialogPresentation.propTypes = {
  currentMapViewAsSavedLocation: PropTypes.object,
  editedLocationId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  t: PropTypes.func,
};

/**
 * Container of the dialog that shows the form that the user can use to
 * edit the server settings.
 */
const SavedLocationEditorDialog = connect(
  // mapStateToProps
  (state) => ({
    currentMapViewAsSavedLocation: getCurrentMapViewAsSavedLocation(state),
    editedLocationId: getEditedLocationId(state),
    open: getEditorDialogVisibility(state),
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
)(withTranslation()(SavedLocationEditorDialogPresentation));

export default SavedLocationEditorDialog;
