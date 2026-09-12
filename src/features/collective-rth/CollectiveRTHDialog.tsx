import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import Divider from '@mui/material/Divider';
import Fade from '@mui/material/Fade';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { Status } from '@skybrush/app-theme-mui';
import {
  DraggableDialog,
  LabeledProgressBar,
  LabeledStatusLight,
} from '@skybrush/mui-components';

import { loadBase64EncodedShow } from '~/features/show/actions';
import {
  selectCollectiveRTHPlanSummary,
  type CollectiveRTHPlanSummary,
} from '~/features/show/selectors';
import type { RTHPlanTaskResult } from '~/features/tasks';
import type { ProgressInfo } from '~/flockwave/messages';
import type { CollectiveRTHParameters } from '~/flockwave/types';
import type { RootState } from '~/store/reducers';
import { formatDuration } from '~/utils/formatting';

import { addCollectiveRTH, saveTransformedShow } from './actions';
import CollectiveRTHParametersForm, {
  useCollectiveRTHParametersFormState,
} from './CollectiveRTHParametersForm';
import {
  isDialogOpen,
  selectCalculatedShowWithRTHPlan,
  selectRTHPlanTask,
} from './selectors';
import { closeDialog } from './slice';

type StateProps = {
  error?: string;
  existingRTHPlanSummary: CollectiveRTHPlanSummary;
  inProgress: boolean;
  open: boolean;
  progress?: ProgressInfo;
  taskResult?: RTHPlanTaskResult['result'];
  transformedShow?: string;
};

type DispatchProps = {
  addCollectiveRTH: (params?: CollectiveRTHParameters) => void;
  applyTransformedShow: (show: string) => void;
  closeDialog: () => void;
  saveTransformedShow: () => void;
};

type Props = DispatchProps & StateProps;

const CollectiveRTHDialog = (props: Props) => {
  const {
    addCollectiveRTH,
    applyTransformedShow,
    closeDialog,
    error,
    existingRTHPlanSummary,
    inProgress,
    open,
    progress,
    saveTransformedShow,
    taskResult,
    transformedShow,
  } = props;
  const parametersFormState = useCollectiveRTHParametersFormState();
  const { t } = useTranslation();
  const submitDisabled = taskResult === undefined;
  const status: Status =
    taskResult !== undefined
      ? Status.SUCCESS
      : inProgress
        ? Status.NEXT
        : error !== undefined
          ? Status.ERROR
          : Status.INFO;
  const statusMessage =
    taskResult !== undefined
      ? t('collectiveRTHDialog.status.success')
      : inProgress
        ? t('collectiveRTHDialog.status.loading')
        : error !== undefined
          ? t('collectiveRTHDialog.status.error')
          : '';

  const parametersForm = (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
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
    </Box>
  );

  return (
    <DraggableDialog
      fullWidth
      disableEscapeKeyDown={inProgress || taskResult !== undefined}
      maxWidth='sm'
      onClose={closeDialog}
      open={open}
      title={t('collectiveRTHDialog.title')}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 2,
          paddingX: 4,
          gap: 1,
        }}
      >
        {inProgress && (
          /* Keyed by the progress message so that the progress bar is remounted
           * when the server starts another subtask: without the key, MUI would
           * smoothly animate the transition from the final progress of the
           * previous subtask back to the (near-zero) progress of the new one,
           * which looks wrong. */
          <LabeledProgressBar
            key={progress?.message}
            label={progress?.message ?? t('collectiveRTHDialog.status.loading')}
            variant={
              progress?.percentage !== undefined
                ? 'determinate'
                : 'indeterminate'
            }
            value={progress?.percentage}
          />
        )}
        {taskResult !== undefined && (
          <>
            <Alert severity='success' variant='filled' sx={{ mt: 1 }}>
              {t('collectiveRTHDialog.summary.numPlans.message', {
                numPlans: taskResult.stats.length,
              })}
            </Alert>
            <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
              {t('collectiveRTHDialog.summary.firstTime.message', {
                firstTime: formatDuration(taskResult.firstTime),
              })}
              <Divider sx={{ flex: 1 }} />
              {t('collectiveRTHDialog.summary.lastTime.message', {
                lastTime: formatDuration(taskResult.lastTime),
              })}
            </Stack>
          </>
        )}
        {taskResult === undefined && !inProgress && error === undefined && (
          <>
            <Typography>{t('collectiveRTHDialog.description')}</Typography>
            {existingRTHPlanSummary.isValid ? (
              <Typography>
                {t('collectiveRTHDialog.existingValidRTHPlan', {
                  numPlans: Object.keys(existingRTHPlanSummary.plans).length,
                })}
              </Typography>
            ) : (
              <Alert severity='warning' variant='filled'>
                {t('collectiveRTHDialog.existingInvalidRTHPlan')}
              </Alert>
            )}
          </>
        )}
        {parametersForm}
      </Box>
      <DialogActions>
        <Fade
          in={inProgress || taskResult !== undefined || error !== undefined}
        >
          <Box sx={{ flex: 1, paddingLeft: 1 }}>
            <LabeledStatusLight
              color='textSecondary'
              status={status}
              size='small'
            >
              {statusMessage}
            </LabeledStatusLight>
          </Box>
        </Fade>
        <Button disabled={inProgress} onClick={() => closeDialog()}>
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

const ConnectedCollectiveRTHDialog = connect(
  // mapStateToProps
  (state: RootState) => {
    const task = selectRTHPlanTask(state);
    return {
      error: task?.status === 'error' ? task.error : undefined,
      existingRTHPlanSummary: selectCollectiveRTHPlanSummary(state),
      inProgress: task?.status === 'running',
      open: isDialogOpen(state),
      progress: task?.status === 'running' ? task.progress : undefined,
      taskResult: task?.status === 'success' ? task.result : undefined,
      transformedShow:
        task?.status === 'success'
          ? selectCalculatedShowWithRTHPlan(state)
          : undefined,
    };
  },
  // mapDispatchToProps
  {
    addCollectiveRTH,
    applyTransformedShow: loadBase64EncodedShow,
    closeDialog,
    saveTransformedShow,
  }
)(CollectiveRTHDialogWrapper);

export default ConnectedCollectiveRTHDialog;
