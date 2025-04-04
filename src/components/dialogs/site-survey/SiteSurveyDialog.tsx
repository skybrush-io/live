import { makeStyles } from '@material-ui/core';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import Paper from '@material-ui/core/Paper';
import React, { useCallback, useState } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import DialogHelpIcon from '~/components/DialogHelpIcon';
import {
  closeDialog,
  initializeWithData,
  type ShowData,
  type SiteSurveyState,
} from '~/features/site-survey/state';
import type { AppDispatch, RootState } from '~/store/reducers';

import AdaptParametersForm, {
  useAdaptParametersFormState,
} from './AdaptParametersForm';
import Map from './map';
import type { DispatchProps, TranslationProps } from './types';

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

type Props = SiteSurveyState & TranslationProps & DispatchProps;

type AdaptStage = 'config' | 'review';

const hiddenStyle: React.CSSProperties = {
  display: 'none',
};

function useOwnState(props: Props) {
  const { closeDialog } = props;
  const [stage, setStage] = useState<AdaptStage>('config');
  const adaptParameters = useAdaptParametersFormState();
  const back = useCallback(() => {
    if (stage === 'config') {
      closeDialog();
    } else if (stage === 'review') {
      setStage('config');
    }
  }, [closeDialog, stage]);
  const submit = useCallback(() => {
    if (stage === 'config') {
      if (!adaptParameters.isValid) {
        return;
      }

      // TODO: adapt show, show a loading indicator.
      setStage('review');
    } else if (stage === 'review') {
      // TODO: save adapted show
      setStage('config');
      closeDialog();
    }
  }, [adaptParameters, closeDialog, stage]);

  return {
    adaptParameters,
    back,
    stage,
    submit,
  };
}

function SiteSurveyDialog(props: Props) {
  const { open, t } = props;
  const styles = useStyles();
  const { adaptParameters, back, stage, submit } = useOwnState(props);

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
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
            }}
          >
            TODO: show overview of changes!
          </div>
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
        <Button onClick={back}>
          {stage === 'review'
            ? t('general.action.back')
            : t('general.action.close')}
        </Button>
        <Button
          color='primary'
          disabled={!adaptParameters.isValid}
          onClick={submit}
        >
          {stage === 'review'
            ? t('general.action.approve')
            : t('siteSurveyDialog.action.adapt')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default connect(
  // -- map state to props (get full dialog state)
  (state: RootState) => ({
    ...state.dialogs.siteSurvey,
  }),
  // -- map dispatch to props
  (dispatch: AppDispatch) => ({
    closeDialog: () => dispatch(closeDialog()),
    initializeWithData: (showData: ShowData) =>
      dispatch(initializeWithData(showData)),
  })
)(withTranslation()(SiteSurveyDialog));
