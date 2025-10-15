import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';

import { closeCoordinateRestorationDialog } from '~/features/rtk/slice';
import {
  getCoordinateRestorationDialog,
  getFormattedSavedCoordinatePosition,
} from '~/features/rtk/selectors';
import {
  setSelectedPresetAsSource,
  useSavedCoordinateForPreset,
} from '~/features/rtk/actions';

const RTKCoordinateRestorationDialog = ({
  t,
  dialog,
  formattedPosition,
  onClose,
  onUseSaved,
  onStartNew,
}) => {
  if (!dialog.open || !dialog.savedCoordinate) {
    return null;
  }

  const { presetId, savedCoordinate } = dialog;
  const { accuracy, savedAt } = savedCoordinate;
  const savedDate = new Date(savedAt).toLocaleDateString();

  const handleUseSaved = () => {
    onClose(); // Close dialog first
    onUseSaved(presetId, savedCoordinate); // Then start async operation
  };

  const handleStartNew = () => {
    onStartNew(presetId);
    onClose();
  };

  return (
    <Dialog
      fullWidth
      open={dialog.open}
      aria-labelledby='coordinate-restoration-dialog-title'
      maxWidth='sm'
      onClose={onClose}
    >
      <DialogTitle id='coordinate-restoration-dialog-title'>
        {t('RTKCoordinateRestorationDialog.title')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {t('RTKCoordinateRestorationDialog.message', {
            position: formattedPosition,
            accuracy: accuracy.toFixed(3),
            date: savedDate,
          })}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button color='primary' onClick={onClose}>
          {t('RTKCoordinateRestorationDialog.cancel')}
        </Button>
        <Button color='primary' onClick={handleStartNew}>
          {t('RTKCoordinateRestorationDialog.startNew')}
        </Button>
        <Button color='primary' variant='contained' onClick={handleUseSaved}>
          {t('RTKCoordinateRestorationDialog.useSaved')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RTKCoordinateRestorationDialog.propTypes = {
  t: PropTypes.func,
  dialog: PropTypes.object,
  formattedPosition: PropTypes.string,
  onClose: PropTypes.func,
  onUseSaved: PropTypes.func,
  onStartNew: PropTypes.func,
};

export default connect(
  (state) => ({
    dialog: getCoordinateRestorationDialog(state),
    formattedPosition: getCoordinateRestorationDialog(state).savedCoordinate
      ? getFormattedSavedCoordinatePosition(
          state,
          getCoordinateRestorationDialog(state).presetId
        )
      : undefined,
  }),
  {
    onClose: closeCoordinateRestorationDialog,
    onUseSaved: useSavedCoordinateForPreset,
    onStartNew: setSelectedPresetAsSource,
  }
)(withTranslation()(RTKCoordinateRestorationDialog));
