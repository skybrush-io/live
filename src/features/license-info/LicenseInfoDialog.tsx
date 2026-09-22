import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import { DraggableDialog } from '@skybrush/mui-components';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import type { RootState } from '~/store/reducers';

import LicenseInfoPanel from './LicenseInfoPanel';
import { closeLicenseInfoDialog } from './slice';

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Presentation component for the dialog that allows the user to retrieve the
 * information about the license on the server.
 */
const LicenseInfoDialog = ({ onClose, open }: Props) => {
  const { t } = useTranslation();

  return (
    <DraggableDialog
      fullWidth
      open={open}
      maxWidth='xs'
      title={t('LicenseInfoDialog.title')}
      onClose={onClose}
    >
      <DialogContent>
        <LicenseInfoPanel />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('general.action.close')}</Button>
      </DialogActions>
    </DraggableDialog>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    open: state.licenseInfo.dialog.open,
  }),

  // mapDispatchToProps
  {
    onClose: closeLicenseInfoDialog,
  }
)(LicenseInfoDialog);
