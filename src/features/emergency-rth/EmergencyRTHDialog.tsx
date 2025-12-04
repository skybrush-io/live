import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { DraggableDialog } from '@skybrush/mui-components';

import { loadBase64EncodedShow } from '~/features/show/actions';
import {
  selectSwarmEmergencyRTHStats,
  type SwarmEmergencyRTHStats,
} from '~/features/show/selectors';
import type { AppDispatch, RootState } from '~/store/reducers';

import { Typography } from '@mui/material';
import {
  addEmergencyRTH,
  type EmergencyRTHConfig,
  saveTransformedShow,
} from './actions';
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
  swarmRTHStats: SwarmEmergencyRTHStats;
  transformationResult?: TransformationResult;
};

type DispatchProps = {
  addEmergencyRTH: (config?: EmergencyRTHConfig) => void;
  applyTransformedShow: (show: string) => void;
  closeDialog: () => void;
  saveTransformedShow: () => void;
};

type Props = DispatchProps & StateProps;

const EmergencyRTHDialog = (props: Props) => {
  const {
    addEmergencyRTH,
    applyTransformedShow,
    closeDialog,
    error,
    inProgress,
    open,
    saveTransformedShow,
    swarmRTHStats,
    transformationResult,
  } = props;
  const { t } = useTranslation();
  const submitDisabled = transformationResult === undefined;

  return (
    <DraggableDialog
      fullWidth
      disableEscapeKeyDown={inProgress || transformationResult !== undefined}
      maxWidth='sm'
      title={t('emergencyRTHDialog.title')}
      open={open}
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
              {t('emergencyRTHDialog.error')}
            </Typography>
            <Typography color='error'>{error}</Typography>
          </>
        )}
        {inProgress && (
          <Typography>{t('emergencyRTHDialog.loading')}</Typography>
        )}
        {transformationResult !== undefined && (
          <>
            <Typography>
              {t(
                transformationResult.firstTime === undefined
                  ? 'emergencyRTHDialog.summary.firstTime.unknown'
                  : 'emergencyRTHDialog.summary.firstTime.message',
                {
                  firstTime: transformationResult.firstTime,
                }
              )}
            </Typography>
            <Typography>
              {t(
                transformationResult.lastTime === undefined
                  ? 'emergencyRTHDialog.summary.lastTime.unknown'
                  : 'emergencyRTHDialog.summary.lastTime.message',
                {
                  lastTime: transformationResult.lastTime,
                }
              )}
            </Typography>
            <Typography>
              {t(
                transformationResult.maxShowDuration === undefined
                  ? 'emergencyRTHDialog.summary.maxShowDuration.unknown'
                  : 'emergencyRTHDialog.summary.maxShowDuration.message',
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
              <Typography>{t('emergencyRTHDialog.description')}</Typography>
              <Typography>
                {t('emergencyRTHDialog.existingRTHPlans', {
                  withRTHPlan: swarmRTHStats.withRTHPlan,
                  total: swarmRTHStats.total,
                })}
              </Typography>
            </>
          )}
        <Box
          sx={{
            display: inProgress ? 'none' : 'flex',
            flexDirection: 'column',
            justifyItems: 'center',
            alignItems: 'center',
          }}
        >
          <Button color='primary' onClick={() => addEmergencyRTH()}>
            {t('emergencyRTHDialog.action.addEmergencyRTH')}
          </Button>
        </Box>
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
const EmergencyRTHDialogWrapper = (props: Props) => {
  const { open, ...rest } = props;
  return open ? <EmergencyRTHDialog open {...rest} /> : null;
};

const ConnectedEmergencyRTHDialog = connect(
  // -- map state to props
  (state: RootState) => ({
    error: selectTransformationError(state),
    inProgress: selectTransformationInProgress(state),
    open: isDialogOpen(state),
    swarmRTHStats: selectSwarmEmergencyRTHStats(state),
    transformationResult: selectResult(state),
  }),
  // -- map dispatch to props
  (dispatch: AppDispatch) => ({
    addEmergencyRTH: (config?: EmergencyRTHConfig): void => {
      dispatch(addEmergencyRTH(config));
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
)(EmergencyRTHDialogWrapper);

export default ConnectedEmergencyRTHDialog;
