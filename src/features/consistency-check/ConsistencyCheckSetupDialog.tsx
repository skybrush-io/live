import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import UploadSetupDialog from '~/features/upload-setup-dialog/UploadSetupDialog';
import type { RootState } from '~/store/reducers';

import ConsistencyCheckMainPanel from './ConsistencyCheckMainPanel';
import ConsistencyCheckSidebar from './ConsistencyCheckSidebar';
import { isConsistencyCheckSetupDialogOpen } from './selectors';
import { closeConsistencyCheckSetupDialog } from './slice';

type Props = {
  onClose: () => void;
  open: boolean;
};

/**
 * Dialog that allows the user to assemble a list of parameter names to check
 * across the drones. Thin wrapper around the shared `SetupDialog` shell.
 */
const ConsistencyCheckSetupDialog = ({ onClose, open }: Props) => {
  const { t } = useTranslation();

  return (
    <UploadSetupDialog
      open={open}
      onClose={onClose}
      title={t('consistencyCheckSetupDialog.checkParameters')}
      sidebar={<ConsistencyCheckSidebar />}
    >
      <ConsistencyCheckMainPanel />
    </UploadSetupDialog>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    open: isConsistencyCheckSetupDialogOpen(state),
  }),

  // mapDispatchToProps
  {
    onClose: closeConsistencyCheckSetupDialog,
  }
)(ConsistencyCheckSetupDialog);
