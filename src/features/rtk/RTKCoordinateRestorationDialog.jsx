import formatDate from 'date-fns/format';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Typography from '@material-ui/core/Typography';

import { closeCoordinateRestorationDialog } from '~/features/rtk/slice';
import {
  getCoordinateRestorationDialog,
  getFormattedSavedCoordinatePosition,
} from '~/features/rtk/selectors';
import { useSavedCoordinateForPreset } from '~/features/rtk/actions';

const RTKCoordinateRestorationDialog = ({
  t,
  dialog,
  formattedPosition,
  onClose,
  onUseSaved,
}) => {
  if (!dialog.open || !dialog.savedCoordinate) {
    return null;
  }

  const { presetId, savedCoordinate } = dialog;
  const { accuracy, savedAt } = savedCoordinate;
  const savedDateTime = formatDate(new Date(savedAt), 'yyyy-MM-dd HH:mm:ss');

  const handleUseSaved = () => {
    onClose(); // Close dialog first
    onUseSaved(presetId, savedCoordinate); // Then start async operation
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
        <Box mt={2} mb={2}>
          <Typography variant="body2" component="div">
            <Box component="div" mb={1}>
              <strong>{t('RTKCoordinateRestorationDialog.positionLabel')}:</strong>{' '}
              {formattedPosition}
            </Box>
            <Box component="div" mb={1}>
              <strong>{t('RTKCoordinateRestorationDialog.accuracyLabel')}:</strong>{' '}
              {accuracy.toFixed(3)} m
            </Box>
            <Box component="div" mb={1}>
              <strong>{t('RTKCoordinateRestorationDialog.dateLabel')}:</strong>{' '}
              {savedDateTime}
            </Box>
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color='primary' onClick={onClose}>
          {t('RTKCoordinateRestorationDialog.cancel')}
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
};

export default connect(
  (state) => {
    const dialog = getCoordinateRestorationDialog(state);
    return {
      dialog,
      formattedPosition: dialog.savedCoordinate && dialog.presetId
        ? getFormattedSavedCoordinatePosition(state, dialog.presetId)
        : undefined,
    };
  },
  {
    onClose: closeCoordinateRestorationDialog,
    onUseSaved: useSavedCoordinateForPreset,
  }
)(withTranslation()(RTKCoordinateRestorationDialog));
