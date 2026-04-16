import formatDate from 'date-fns/format';
import { useTranslation } from 'react-i18next';
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

import { BackgroundHint } from '@skybrush/mui-components';

import { wrapInErrorHandler } from '~/error-handling';
import { useSavedCoordinateForPreset } from '~/features/rtk/actions';
import {
  getCoordinateRestorationDialogState,
  getPreferredSavedRTKPositionFormatter,
  getSavedCoordinatesForPreset,
} from '~/features/rtk/selectors';
import { closeCoordinateRestorationDialog } from '~/features/rtk/slice';
import Download from '~/icons/Download';
import type { RootState } from '~/store/reducers';
import { formatDistance } from '~/utils/formatting';

import type { RTKSavedCoordinate } from './types';

type SavedCoordinateItemProps = {
  coordinate: RTKSavedCoordinate;
  coordinateFormatter: (coordinate?: RTKSavedCoordinate) => string | undefined;
  onClick: (coordinate: RTKSavedCoordinate) => void;
};

const SavedCoordinateItem = ({
  coordinate,
  coordinateFormatter,
  onClick,
}: SavedCoordinateItemProps) => {
  const { accuracy, savedAt } = coordinate;
  const savedDateTime = formatDate(new Date(savedAt), 'yyyy-MM-dd HH:mm:ss');

  const formattedPosition = coordinateFormatter(coordinate);

  return (
    <ListItem disablePadding>
      <ListItemButton onClick={() => onClick(coordinate)}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
          }}
        >
          <ListItemText
            primary={formattedPosition}
            secondary={`Accuracy: ${formatDistance(accuracy, 3)} • ${savedDateTime}`}
          />
          <Download sx={{ marginLeft: 2 }} />
        </Box>
      </ListItemButton>
    </ListItem>
  );
};

type RTKCoordinateRestorationDialogProps = {
  coordinateFormatter: (coordinate?: RTKSavedCoordinate) => string | undefined;
  dialog: {
    open: boolean;
    presetId?: string;
  };
  onClose: () => void;
  onUseSaved: (
    presetId: string | undefined,
    coordinate: RTKSavedCoordinate
  ) => void;
  savedCoordinates: RTKSavedCoordinate[];
};

const RTKCoordinateRestorationDialog = ({
  coordinateFormatter,
  dialog,
  onClose,
  onUseSaved,
  savedCoordinates,
}: RTKCoordinateRestorationDialogProps) => {
  const { presetId } = dialog;

  const { t } = useTranslation();
  const handleUseSaved = (coordinate: RTKSavedCoordinate) => {
    onClose(); // Close dialog first
    wrapInErrorHandler(() => onUseSaved(presetId, coordinate))(); // Then start async operation
  };

  return (
    <Dialog fullWidth open={dialog.open} maxWidth='sm' onClose={onClose}>
      <DialogTitle>{t('RTKCoordinateRestorationDialog.title')}</DialogTitle>
      <DialogContent>
        <Box>
          {savedCoordinates.length === 0 ? (
            <BackgroundHint
              text={t('RTKCoordinateRestorationDialog.noSavedCoordinates')}
            />
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
          {t('general.action.cancel')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default connect(
  (state: RootState) => {
    const dialog = getCoordinateRestorationDialogState(state);

    const coordinateFormatter = getPreferredSavedRTKPositionFormatter(state);

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
)(RTKCoordinateRestorationDialog);
