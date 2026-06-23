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
import { DraggableDialog, LabeledStatusLight } from '@skybrush/mui-components';

import { loadBase64EncodedShow } from '~/features/show/actions';
import {
  selectCollectiveRTHPlanSummary,
  type CollectiveRTHPlanSummary,
} from '~/features/show/selectors';
import type { RootState } from '~/store/reducers';
import { formatDuration } from '~/utils/formatting';

import {
  addCollectiveRTH,
  saveTransformedShow,
  type CollectiveRTHParameters,
} from './actions';
import CollectiveRTHParametersForm, {
  useCollectiveRTHParametersFormState,
} from './CollectiveRTHParametersForm';
import {
  isDialogOpen,
  selectResult,
  selectTransformationError,
  selectTransformationInProgress,
} from './selectors';
import { closeDialog, type TransformationResult } from './slice';

type StateProps = {
  error?: string;
  existingRTHPlanSummary: CollectiveRTHPlanSummary;
  inProgress: boolean;
  open: boolean;
  transformationResult?: TransformationResult;
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
    saveTransformedShow,
    transformationResult,
  } = props;
  const parametersFormState = useCollectiveRTHParametersFormState();
  const { t } = useTranslation();
  const submitDisabled = transformationResult === undefined;
  const status: Status =
    transformationResult !== undefined
      ? Status.SUCCESS
      : inProgress
        ? Status.NEXT
        : error !== undefined
          ? Status.ERROR
          : Status.INFO;
  const statusMessage =
    transformationResult !== undefined
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
      disableEscapeKeyDown={inProgress || transformationResult !== undefined}
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
        {transformationResult !== undefined && (
          <>
            <Alert severity='success' variant='filled' sx={{ mt: 1 }}>
              {t('collectiveRTHDialog.summary.numPlans.message', {
                numPlans: transformationResult.stats.length,
              })}
            </Alert>
            <Stack direction='row' spacing={2} sx={{ alignItems: 'center' }}>
              {t('collectiveRTHDialog.summary.firstTime.message', {
                firstTime: formatDuration(transformationResult.firstTime),
              })}
              <Divider sx={{ flex: 1 }} />
              {t('collectiveRTHDialog.summary.lastTime.message', {
                lastTime: formatDuration(transformationResult.lastTime),
              })}
            </Stack>
          </>
        )}
        {transformationResult === undefined &&
          !inProgress &&
          error === undefined && (
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
          in={
            inProgress ||
            transformationResult !== undefined ||
            error !== undefined
          }
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
            const show = transformationResult?.show;
            if (show === undefined) {
              console.warn(
                "Tried to apply transformed show, but it's undefined."
              );
              return;
            }

            applyTransformedShow(show);
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
  (state: RootState) => ({
    error: selectTransformationError(state),
    existingRTHPlanSummary: selectCollectiveRTHPlanSummary(state),
    inProgress: selectTransformationInProgress(state),
    open: isDialogOpen(state),
    transformationResult: selectResult(state),
  }),
  // mapDispatchToProps
  {
    addCollectiveRTH,
    applyTransformedShow: loadBase64EncodedShow,
    closeDialog,
    saveTransformedShow,
  }
)(CollectiveRTHDialogWrapper);

export default ConnectedCollectiveRTHDialog;
