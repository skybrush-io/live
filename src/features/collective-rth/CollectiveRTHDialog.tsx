import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Help from '@mui/icons-material/Help';
import { DraggableDialog, Tooltip } from '@skybrush/mui-components';

import type { RootState } from '~/store/reducers';

import CollectiveRTHDialogBottomArea from './CollectiveRTHDialogBottomArea';
import CollectiveRTHDialogContent from './CollectiveRTHDialogContent';
import type { CollectiveRTHPlanningPhase } from './selectors';
import { isDialogOpen, selectCollectiveRTHPlanningPhase } from './selectors';
import { closeDialog } from './slice';

type Props = {
  closeDialog: () => void;
  open: boolean;
  phase: CollectiveRTHPlanningPhase;
};

const CollectiveRTHDialog = ({ closeDialog, open, phase }: Props) => {
  const { t } = useTranslation();

  return (
    <DraggableDialog
      fullWidth
      disableEscapeKeyDown={phase === 'waitingForApproval'}
      maxWidth='sm'
      onClose={closeDialog}
      open={open}
      title={t('collectiveRTHDialog.title')}
      titleComponents={
        <Tooltip content={t('collectiveRTHDialog.description')}>
          <Help color='disabled' />
        </Tooltip>
      }
    >
      <CollectiveRTHDialogContent />
      <CollectiveRTHDialogBottomArea />
    </DraggableDialog>
  );
};

/**
 * Wrapper that only renders the dialog when it is open.
 *
 * The reason for this is to correctly initialize the dialog's state
 * when it is opened.
 */
const CollectiveRTHDialogWrapper = ({ open, ...rest }: Props) =>
  open ? <CollectiveRTHDialog open {...rest} /> : null;

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    open: isDialogOpen(state),
    phase: selectCollectiveRTHPlanningPhase(state),
  }),
  // mapDispatchToProps
  { closeDialog }
)(CollectiveRTHDialogWrapper);
