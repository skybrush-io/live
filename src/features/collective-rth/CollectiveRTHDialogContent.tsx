import Button from '@mui/material/Button';
import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import type { CollectiveRTHParameters } from '~/flockwave/types';
import type { RootState } from '~/store/reducers';

import { addCollectiveRTH } from './actions';
import CollectiveRTHParametersForm, {
  useCollectiveRTHParametersFormState,
} from './CollectiveRTHParametersForm';
import {
  type CollectiveRTHPlanningPhase,
  selectCollectiveRTHPlanningPhase,
} from './selectors';

type Props = {
  addCollectiveRTH: (params?: CollectiveRTHParameters) => void;
  phase: CollectiveRTHPlanningPhase;
};

const CollectiveRTHDialogContent = ({ addCollectiveRTH, phase }: Props) => {
  const parametersFormState = useCollectiveRTHParametersFormState();
  const { t } = useTranslation();
  const inProgress = phase === 'planning';

  return (
    <DialogContent>
      <Stack gap={1}>
        <CollectiveRTHParametersForm
          disabled={inProgress}
          {...parametersFormState}
        />
        <Button
          color='primary'
          loading={inProgress}
          loadingPosition='start'
          onClick={() => {
            void addCollectiveRTH(parametersFormState.parameters);
          }}
          sx={{ margin: 'auto' }}
        >
          {t('collectiveRTHDialog.action.addCollectiveRTH')}
        </Button>
      </Stack>
    </DialogContent>
  );
};

export default connect(
  // mapStateToProps
  (state: RootState) => ({
    phase: selectCollectiveRTHPlanningPhase(state),
  }),
  // mapDispatchToProps
  { addCollectiveRTH }
)(CollectiveRTHDialogContent);
