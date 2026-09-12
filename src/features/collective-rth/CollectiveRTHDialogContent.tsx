import Button from '@mui/material/Button';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import type { CollectiveRTHParameters } from '~/flockwave/types';
import type { RootState } from '~/store/reducers';

import DialogContent from '@mui/material/DialogContent';
import Stack from '@mui/material/Stack';
import { addCollectiveRTH } from './actions';
import CollectiveRTHParametersForm, {
  useCollectiveRTHParametersFormState,
} from './CollectiveRTHParametersForm';
import { selectRTHPlanTaskPhase } from './selectors';

type Props = {
  addCollectiveRTH: (params?: CollectiveRTHParameters) => void;
  inProgress: boolean;
};

const CollectiveRTHDialogContent = ({
  addCollectiveRTH,
  inProgress,
}: Props) => {
  const parametersFormState = useCollectiveRTHParametersFormState();
  const { t } = useTranslation();

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
          onClick={() => addCollectiveRTH(parametersFormState.parameters)}
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
    inProgress: selectRTHPlanTaskPhase(state) === 'running',
  }),
  // mapDispatchToProps
  { addCollectiveRTH }
)(CollectiveRTHDialogContent);
