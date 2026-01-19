import formatDate from 'date-fns/format';
import PropTypes from 'prop-types';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';

import { closeCoordinateRestorationDialog } from '~/features/rtk/slice';
import {
  getCoordinateRestorationDialog,
  getFormattedCoordinatePosition,
  getSavedCoordinatesForPreset,
} from '~/features/rtk/selectors';
import { useSavedCoordinateForPreset } from '~/features/rtk/actions';

const SavedCoordinateItem = ({ coordinate, coordinateFormatter, onClick }) => {
  const { accuracy, savedAt } = coordinate;
  const savedDateTime = formatDate(new Date(savedAt), 'yyyy-MM-dd HH:mm:ss');

  const formattedPosition = coordinateFormatter(coordinate);

  return (
    <ListItem disablePadding>
      <ListItemButton onClick={() => onClick(coordinate)}>
        <ListItemText
          primary={formattedPosition}
          secondary={`Accuracy: ${accuracy.toFixed(3)} m • ${savedDateTime}`}
        />
      </ListItemButton>
    </ListItem>
  );
};

const RTKCoordinateRestorationDialog = ({
  t,
  dialog,
  savedCoordinates,
  coordinateFormatter,
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
        <Box>
          {savedCoordinates.length === 0 ? (
            <Box p={2} textAlign='center'>
              {t('RTKCoordinateRestorationDialog.noSavedCoordinates')}
            </Box>
          ) : (
            <List>
              {savedCoordinates.map((coordinate) => (
                <SavedCoordinateItem
                  key={coordinate.savedAt}
                  coordinate={coordinate}
                  coordinateFormatter={coordinateFormatter}
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
  coordinateFormatter: PropTypes.func,
  onClose: PropTypes.func,
  onUseSaved: PropTypes.func,
};

export default connect(
  (state) => {
    const dialog = getCoordinateRestorationDialog(state);

    const coordinateFormatter = (coordinate) =>
      getFormattedCoordinatePosition(state, coordinate);

    return {
      dialog,
      savedCoordinates: dialog.presetId
        ? getSavedCoordinatesForPreset(state, dialog.presetId)
        : [],
      coordinateFormatter,
    };
  },
  {
    onClose: closeCoordinateRestorationDialog,
    onUseSaved: useSavedCoordinateForPreset,
  }
)(withTranslation()(RTKCoordinateRestorationDialog));
