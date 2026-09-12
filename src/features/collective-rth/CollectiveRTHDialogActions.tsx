import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { loadBase64EncodedShow } from '~/features/show/actions';
import type { RootState } from '~/store/reducers';

import { saveTransformedShow } from './actions';
import ConnectedRTHPlanStatusLight from './RTHPlanStatusLight';
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
  saveTransformedShow: () => void;
  transformedShow?: string;
};

const CollectiveRTHDialogActions = ({
  applyTransformedShow,
  closeDialog,
  phase,
  saveTransformedShow,
  transformedShow,
}: Props) => {
  const { t } = useTranslation();
  const submitDisabled = phase !== 'success';

  return (
    <DialogActions sx={{ px: 3 }}>
      <ConnectedRTHPlanStatusLight />
      <Button disabled={phase === 'running'} onClick={() => closeDialog()}>
        {t('general.action.close')}
      </Button>
      <Button
        color='primary'
        disabled={submitDisabled}
        onClick={() => {
          saveTransformedShow();
        }}
      >
        {t('general.action.save')}
      </Button>
      <Button
        color='primary'
        disabled={submitDisabled}
        onClick={() => {
          if (transformedShow === undefined) {
            console.warn(
              "Tried to apply transformed show, but it's undefined."
            );
            return;
          }

          applyTransformedShow(transformedShow);
          closeDialog();
        }}
      >
        {t('general.action.approve')}
      </Button>
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
    saveTransformedShow,
  }
)(CollectiveRTHDialogActions);
