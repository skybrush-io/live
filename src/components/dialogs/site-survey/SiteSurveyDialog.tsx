import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  closeDialog,
  initializeWithData,
  type ShowData,
  type SiteSurveyState,
} from '~/features/site-survey/state';
import type { AppDispatch, RootState } from '~/store/reducers';

import Map from './map';
import type { DispatchProps, TranslationProps } from './types';

type Props = SiteSurveyState & TranslationProps & DispatchProps;

function SiteSurveyDialog(props: Props) {
  const { closeDialog, open, t } = props;
  return (
    <Dialog fullScreen open={open} onClose={closeDialog}>
      <DialogContent>
        <Map />
      </DialogContent>
      <DialogActions>
        <Button onClick={closeDialog}>{t('general.action.close')}</Button>
        <Button color='primary' onClick={closeDialog}>
          {t('general.action.save')}
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
