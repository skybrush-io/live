import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import { loadBase64EncodedShow } from '~/features/show/actions';
import {
  selectSwarmCollectiveRTHStats,
  type SwarmCollectiveRTHStats,
} from '~/features/show/selectors';
import type { AppDispatch, RootState } from '~/store/reducers';

import {
  addCollectiveRTH,
  type CollectiveRTHParameters,
  saveTransformedShow,
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
import { closeDialog, type TransformationResult } from './state';

type StateProps = {
  error?: string;
  inProgress: boolean;
  open: boolean;
  swarmRTHStats: SwarmCollectiveRTHStats;
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
    inProgress,
    open,
    saveTransformedShow,
    swarmRTHStats,
    transformationResult,
  } = props;
  const parametersFormState = useCollectiveRTHParametersFormState();
  const { t } = useTranslation();
  const submitDisabled = transformationResult === undefined;

  const parameteresForm = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 2 }}>
      <CollectiveRTHParametersForm
        disabled={inProgress}
        {...parametersFormState}
      />
      <Box
        sx={{
          display: inProgress ? 'none' : 'flex',
          flexDirection: 'column',
          justifyItems: 'center',
          alignItems: 'center',
        }}
      >
        <Button
          color='primary'
          onClick={() => addCollectiveRTH(parametersFormState.parameters)}
        >
          {t('collectiveRTHDialog.action.addCollectiveRTH')}
        </Button>
      </Box>
    </Box>
  );

  return (
    <DraggableDialog
      fullWidth
      disableEscapeKeyDown={inProgress || transformationResult !== undefined}
      maxWidth='sm'
      open={open}
      title={t('collectiveRTHDialog.title')}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          paddingTop: 2,
          paddingLeft: 4,
          paddingRight: 4,
          gap: 2,
        }}
      >
        {error !== undefined && (
          <>
            <Typography color='error'>
              {t('collectiveRTHDialog.error')}
            </Typography>
            <Typography color='error'>{error}</Typography>
          </>
        )}
        {inProgress && (
          <Typography>{t('collectiveRTHDialog.loading')}</Typography>
        )}
        {transformationResult !== undefined && (
          <>
            <Typography>
              {t(
                transformationResult.firstTime === undefined
                  ? 'collectiveRTHDialog.summary.firstTime.unknown'
                  : 'collectiveRTHDialog.summary.firstTime.message',
                {
                  firstTime: transformationResult.firstTime,
                }
              )}
            </Typography>
            <Typography>
              {t(
                transformationResult.lastTime === undefined
                  ? 'collectiveRTHDialog.summary.lastTime.unknown'
                  : 'collectiveRTHDialog.summary.lastTime.message',
                {
                  lastTime: transformationResult.lastTime,
                }
              )}
            </Typography>
            <Typography>
              {t(
                transformationResult.maxShowDuration === undefined
                  ? 'collectiveRTHDialog.summary.maxShowDuration.unknown'
                  : 'collectiveRTHDialog.summary.maxShowDuration.message',
                {
                  maxShowDuration: transformationResult.maxShowDuration,
                }
              )}
            </Typography>
          </>
        )}
        {transformationResult === undefined &&
          !inProgress &&
          error === undefined && (
            <>
              <Typography>{t('collectiveRTHDialog.description')}</Typography>
              <Typography>
                {t('collectiveRTHDialog.existingRTHPlans', {
                  withRTHPlan: swarmRTHStats.withRTHPlan,
                  total: swarmRTHStats.total,
                })}
              </Typography>
            </>
          )}
        {parameteresForm}
      </Box>
      <DialogActions>
        <Box sx={{ flex: 1 }} />
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
const CollectiveRTHDialogWrapper = (props: Props) => {
  const { open, ...rest } = props;
  return open ? <CollectiveRTHDialog open {...rest} /> : null;
};

const ConnectedCollectiveRTHDialog = connect(
  // -- map state to props
  (state: RootState) => ({
    error: selectTransformationError(state),
    inProgress: selectTransformationInProgress(state),
    open: isDialogOpen(state),
    swarmRTHStats: selectSwarmCollectiveRTHStats(state),
    transformationResult: selectResult(state),
  }),
  // -- map dispatch to props
  (dispatch: AppDispatch) => ({
    addCollectiveRTH: (params?: CollectiveRTHParameters): void => {
      dispatch(addCollectiveRTH(params));
    },
    applyTransformedShow: (show: string): void => {
      dispatch(loadBase64EncodedShow(show));
    },
    closeDialog: (): void => {
      dispatch(closeDialog());
    },
    saveTransformedShow: (): void => {
      dispatch(saveTransformedShow());
    },
  })
)(CollectiveRTHDialogWrapper);

export default ConnectedCollectiveRTHDialog;
