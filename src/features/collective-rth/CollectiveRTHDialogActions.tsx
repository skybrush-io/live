import Check from '@mui/icons-material/Check';
import Close from '@mui/icons-material/Close';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { loadBase64EncodedShow } from '~/features/show/actions';
import type { RootState } from '~/store/reducers';

import { rejectTransformedShow, saveTransformedShow } from './actions';
import type { RTHPlanTaskPhase } from './selectors';
import {
  selectCalculatedShowWithRTHPlan,
  selectRTHPlanTaskPhase,
} from './selectors';
import { closeDialog } from './slice';

type Props = {
  applyTransformedShow: (show: string) => void;
  closeDialog: () => void;
  phase: RTHPlanTaskPhase;
  rejectTransformedShow: () => void;
  saveTransformedShow: () => void;
  transformedShow?: string;
};

const CollectiveRTHDialogActions = ({
  applyTransformedShow,
  closeDialog,
  phase,
  rejectTransformedShow,
  saveTransformedShow,
  transformedShow,
}: Props) => {
  const { t } = useTranslation();

  return (
    <DialogActions sx={{ px: 3 }}>
      <Button disabled={phase === 'running'} onClick={() => closeDialog()}>
        {t('general.action.close')}
      </Button>
      {phase === 'success' && (
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
            disabled={transformedShow === undefined}
            onClick={() => {
              if (transformedShow !== undefined) {
                applyTransformedShow(transformedShow);
                closeDialog();
              }
            }}
          >
            <Check />
            {t('general.action.approve')}
          </Button>
          <Button
            color='error'
            disabled={transformedShow === undefined}
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
    phase: selectRTHPlanTaskPhase(state),
    transformedShow: selectCalculatedShowWithRTHPlan(state),
  }),
  // mapDispatchToProps
  {
    applyTransformedShow: loadBase64EncodedShow,
    closeDialog,
    rejectTransformedShow,
    saveTransformedShow,
  }
)(CollectiveRTHDialogActions);
