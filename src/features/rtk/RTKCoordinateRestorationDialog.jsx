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
import DialogTitle from '@material-ui/core/DialogTitle';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import { closeCoordinateRestorationDialog } from '~/features/rtk/slice';
import {
  getCoordinateRestorationDialog,
  getFormattedCoordinatePosition,
  getSavedCoordinatesForPreset,
} from '~/features/rtk/selectors';
import { useSavedCoordinateForPreset } from '~/features/rtk/actions';

const SavedCoordinateItem = connect((state, { coordinate }) => ({
  formattedPosition: getFormattedCoordinatePosition(state, coordinate),
}))(({ coordinate, formattedPosition, onClick }) => {
  const { accuracy, savedAt } = coordinate;
  const savedDateTime = formatDate(new Date(savedAt), 'yyyy-MM-dd HH:mm:ss');

  return (
    <ListItem button onClick={() => onClick(coordinate)}>
      <ListItemText
        primary={formattedPosition}
        secondary={`Accuracy: ${accuracy.toFixed(3)} m • ${savedDateTime}`}
      />
    </ListItem>
  );
});

const RTKCoordinateRestorationDialog = ({
  t,
  dialog,
  savedCoordinates,
  onClose,
  onUseSaved,
}) => {
  if (!dialog.open) {
    return null;
  }

  const { presetId } = dialog;

  const handleUseSaved = (coordinate) => {
    onClose(); // Close dialog first
    onUseSaved(presetId, coordinate); // Then start async operation
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
          {savedCoordinates.length === 0 ? (
            <Box p={2} textAlign='center'>
              {t('RTKCoordinateRestorationDialog.noSavedCoordinates')}
            </Box>
          ) : (
            <List>
              {savedCoordinates.map((coordinate, index) => (
                <SavedCoordinateItem
                  key={coordinate.savedAt}
                  coordinate={coordinate}
                  onClick={handleUseSaved}
                />
              ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color='primary' onClick={onClose}>
          {t('RTKCoordinateRestorationDialog.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

RTKCoordinateRestorationDialog.propTypes = {
  t: PropTypes.func,
  dialog: PropTypes.object,
  savedCoordinates: PropTypes.array,
  onClose: PropTypes.func,
  onUseSaved: PropTypes.func,
};

export default connect(
  (state) => {
    const dialog = getCoordinateRestorationDialog(state);
    return {
      dialog,
      savedCoordinates: dialog.presetId
        ? getSavedCoordinatesForPreset(state, dialog.presetId)
        : [],
    };
  },
  {
    onClose: closeCoordinateRestorationDialog,
    onUseSaved: useSavedCoordinateForPreset,
  }
)(withTranslation()(RTKCoordinateRestorationDialog));
