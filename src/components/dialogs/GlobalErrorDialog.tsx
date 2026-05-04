/**
 * @file The global error dialog that appears on top of the main window when
 * there is an unexpected error.
 */

import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { closeErrorDialog } from '~/features/error-handling/actions';
import type { RootState } from '~/store/reducers';

type GlobalErrorDialogProps = {
  message?: string;
  open: boolean;
  onClose?: () => void;
};

const GlobalErrorDialog = ({
  open,
  message,
  onClose,
}: GlobalErrorDialogProps) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open}>
      <DialogTitle>{t('GlobalErrorDialog.title')}</DialogTitle>
      <DialogContent>
        <DialogContentText style={{ whiteSpace: 'pre-line' }}>
          {message}
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('general.action.close')}</Button>
      </DialogActions>
    </Dialog>
  );
};

/**
 * Global error dialog.
 */
export default connect(
  // mapStateToProps
  (state: RootState) => state.dialogs.error,
  // mapDispatchToProps
  {
    onClose: closeErrorDialog,
  }
)(GlobalErrorDialog);
