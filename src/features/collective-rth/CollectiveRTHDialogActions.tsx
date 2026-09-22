import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import type { RootState } from '~/store/reducers';

import {
  approveTransformedShow,
  rejectTransformedShow,
  saveTransformedShow,
} from './actions';
import type { CollectiveRTHPlanningPhase } from './selectors';
import {
  canCloseDialogInPhase,
  selectCollectiveRTHPlanningPhase,
} from './selectors';
import { closeDialog } from './slice';

type Props = {
  approveTransformedShow: () => void;
  closeDialog: () => void;
  phase: CollectiveRTHPlanningPhase;
  rejectTransformedShow: () => void;
  saveTransformedShow: () => void;
};

const CollectiveRTHDialogActions = ({
  approveTransformedShow,
  closeDialog,
  phase,
  rejectTransformedShow,
  saveTransformedShow,
}: Props) => {
  const { t } = useTranslation();

  return (
    <DialogActions sx={{ px: 3 }}>
      <Button
        disabled={!canCloseDialogInPhase(phase)}
        onClick={() => closeDialog()}
      >
        {t('general.action.close')}
      </Button>
      {phase === 'waitingForApproval' && (
        <>
          <Button
            color='primary'
            onClick={() => {
              saveTransformedShow();
            }}
          >
            {t('general.action.save')}
          </Button>
          <Button
            color='success'
            onClick={() => {
              approveTransformedShow();
              closeDialog();
            }}
          >
            <Check />
            {t('general.action.approve')}
          </Button>
          <Button
            color='error'
            onClick={() => {
              rejectTransformedShow();
            }}
          >
            <Close />
            {t('general.action.reject')}
          </Button>
        </>
      )}
    </DialogActions>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    phase: selectCollectiveRTHPlanningPhase(state),
  }),
  // mapDispatchToProps
  {
    approveTransformedShow,
    closeDialog,
    rejectTransformedShow,
    saveTransformedShow,
  }
)(CollectiveRTHDialogActions);
