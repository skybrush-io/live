import { makeStyles } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Paper from '@material-ui/core/Paper';
import type { TFunction } from 'i18next';
import React, { useCallback, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { batch, connect } from 'react-redux';

import DialogHelpIcon from '~/components/DialogHelpIcon';
import { loadBase64EncodedShow } from '~/features/show/actions';
import {
  setOutdoorShowOrientation,
  setOutdoorShowOrigin,
} from '~/features/show/slice';
import type { OutdoorCoordinateSystemWithOrigin } from '~/features/show/types';
import {
  adaptShow,
  type ShowAdaptParameters,
} from '~/features/site-survey/actions';
import {
  selectAdaptedShowAsBase64String,
  selectCoordinateSystem,
  selectIsShowAdaptInProgress,
} from '~/features/site-survey/selectors';
import { closeDialog, setAdaptResult } from '~/features/site-survey/state';
import type { AppDispatch, RootState } from '~/store/reducers';
import { writeBlobToFile } from '~/utils/filesystem';
import { LonLat } from '~/utils/geography';

import AdaptParametersForm, {
  useAdaptParametersFormState,
} from './AdaptParametersForm';
import AdaptReviewForm from './AdaptReviewForm';
import Map from './map';

const useStyles = makeStyles((theme) => ({
  contentRoot: {
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: theme.spacing(2),
  },
  sidebar: {
    padding: theme.spacing(1),
    overflow: 'auto',
  },
  mainContent: {
    padding: theme.spacing(1),
  },
}));

const paperElevation = 2;

type DispatchProps = {
  adaptShow: (parameters: ShowAdaptParameters) => void;
  approveAdaptedShow: (
    base64Blob: string,
    showOrigin: LonLat,
    showOrientation: string
  ) => void;
  closeDialog: () => void;
  resetAdaptResult: () => void;
};

type StateProps = {
  adaptedBase64Show: string | undefined;
  backDisabled: boolean;
  coordinateSystem: OutdoorCoordinateSystemWithOrigin;
  open: boolean;
};

type Props = StateProps &
  DispatchProps & {
    t: TFunction;
  };

type AdaptStage = 'config' | 'review';

const hiddenStyle: React.CSSProperties = {
  display: 'none',
};

function useOwnState(props: Props) {
  const {
    adaptShow,
    adaptedBase64Show,
    approveAdaptedShow,
    backDisabled,
    closeDialog,
    coordinateSystem,
    resetAdaptResult,
  } = props;
  const [stage, setStage] = useState<AdaptStage>('config');
  const adaptParameters = useAdaptParametersFormState(
    undefined,
    resetAdaptResult
  );

  const back = useCallback(() => {
    if (backDisabled) {
      // Shouldn't happen, because the button should be disabled.
      console.error('Back actions is disabled but action was triggered.');
      return;
    }

    if (stage === 'config') {
      closeDialog();
    } else if (stage === 'review') {
      setStage('config');
    }
  }, [backDisabled, closeDialog, stage]);

  const submitDisabled =
    !adaptParameters.isValid ||
    (stage === 'review' && adaptedBase64Show === undefined);

  const submit = useCallback(() => {
    if (submitDisabled) {
      // Shouldn't happen.
      console.error('Submit action is disabled but action was triggered.');
      return;
    }

    if (stage === 'config') {
      if (!adaptParameters.isValid) {
        return;
      }

      if (adaptedBase64Show === undefined) {
        adaptShow(adaptParameters.parameters);
      }
      setStage('review');
    } else if (stage === 'review') {
      if (adaptedBase64Show === undefined) {
        // Shouldn't happen.
        console.error('Adapted show is undefined');
        return;
      }

      approveAdaptedShow(
        adaptedBase64Show,
        coordinateSystem.origin,
        coordinateSystem.orientation
      );
      setStage('config');
      closeDialog();
    }
  }, [adaptParameters, closeDialog, stage, submitDisabled]);

  return {
    adaptedBase64Show,
    adaptParameters,
    adaptShow,
    approveAdaptedShow,
    back,
    coordinateSystem,
    stage,
    submit,
    submitDisabled,
  };
}

function SiteSurveyDialog(props: Props) {
  const { adaptedBase64Show, backDisabled, open, t } = props;
  const styles = useStyles();
  const { adaptParameters, back, stage, submit, submitDisabled } =
    useOwnState(props);

  return (
    <Dialog fullScreen open={open}>
      <DialogContent className={styles.contentRoot}>
        <Paper
          className={styles.mainContent}
          elevation={paperElevation}
          style={stage === 'config' ? undefined : hiddenStyle}
        >
          <Map />
        </Paper>
        <Paper
          className={styles.mainContent}
          elevation={paperElevation}
          style={stage === 'review' ? undefined : hiddenStyle}
        >
          <AdaptReviewForm />
        </Paper>
        <Paper className={styles.sidebar} elevation={paperElevation}>
          <AdaptParametersForm
            {...adaptParameters}
            disabled={stage !== 'config'}
          />
        </Paper>
      </DialogContent>
      <DialogActions>
        <DialogHelpIcon content={t(`siteSurveyDialog.help.${stage}`)} />
        <Button onClick={back} disabled={backDisabled}>
          {stage === 'review'
            ? t('general.action.back')
            : t('general.action.close')}
        </Button>
        {stage === 'review' && (
          <Button
            color='primary'
            disabled={submitDisabled}
            onClick={async () => {
              if (submitDisabled || !adaptedBase64Show) {
                return;
              }
              await writeBlobToFile(
                new Blob([
                  Uint8Array.from(
                    atob(adaptedBase64Show)
                      .split('')
                      .map((char) => char.charCodeAt(0))
                  ),
                ]),
                'adapted-show.skyc'
              );
            }}
          >
            {t('general.action.save')}
          </Button>
        )}
        <Button color='primary' disabled={submitDisabled} onClick={submit}>
          {stage === 'review'
            ? t('general.action.approve')
            : t('siteSurveyDialog.action.adapt')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default connect(
  // -- map state to props
  (state: RootState) => ({
    adaptedBase64Show: selectAdaptedShowAsBase64String(state),
    backDisabled: selectIsShowAdaptInProgress(state),
    coordinateSystem: selectCoordinateSystem(state),
    open: state.dialogs.siteSurvey.open,
  }),
  // -- map dispatch to props
  (dispatch: AppDispatch) => ({
    adaptShow: (params: ShowAdaptParameters) => dispatch(adaptShow(params)),
    approveAdaptedShow: (
      base64Blob: string,
      showOrigin: LonLat,
      showOrientation: string
    ) =>
      batch(() => {
        dispatch(setOutdoorShowOrigin(showOrigin));
        dispatch(setOutdoorShowOrientation(showOrientation));
        dispatch(loadBase64EncodedShow(base64Blob));
      }),
    closeDialog: () => dispatch(closeDialog()),
    resetAdaptResult: () => dispatch(setAdaptResult(undefined)),
  })
)(withTranslation()(SiteSurveyDialog));
