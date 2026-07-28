import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import UploadSetupDialog from '~/features/upload-setup-dialog/UploadSetupDialog';
import type { RootState } from '~/store/reducers';

import ParameterListSidebar from './ParameterListSidebar';
import ParameterUploadMainPanel from './ParameterUploadMainPanel';
import { isParameterUploadSetupDialogOpen } from './selectors';
import { closeParameterUploadSetupDialog } from './slice';

type Props = {
  onClose: () => void;
  open: boolean;
};

/**
 * Dialog that allows the user to assemble a list of parameters to upload to
 * the drones. Thin wrapper around the shared `SetupDialog` shell.
 */
const ParameterUploadSetupDialog = ({ onClose, open }: Props) => {
  const { t } = useTranslation();

  return (
    <UploadSetupDialog
      open={open}
      onClose={onClose}
      title={t('parameterUploadSetupDialog.uploadParameters')}
      sidebar={<ParameterListSidebar />}
    >
      <ParameterUploadMainPanel />
    </UploadSetupDialog>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    open: isParameterUploadSetupDialogOpen(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeParameterUploadSetupDialog,
  }
)(ParameterUploadSetupDialog);
