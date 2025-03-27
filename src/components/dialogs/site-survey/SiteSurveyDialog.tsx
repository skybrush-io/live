import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { selectInitDataSources } from '~/features/site-survey/selectors';
import { adaptLoadedShow } from '~/features/show/actions';
import {
  closeDialog,
  initializeWithData,
  type ShowData,
  type SiteSurveyState,
} from '~/features/site-survey/state';
import type { AppDispatch, RootState } from '~/store/reducers';

import Initializer from './Initializer';
import Map from './map';
import type {
  DataSourcesProps,
  DispatchProps,
  TranslationProps,
} from './types';

type Props = SiteSurveyState &
  DataSourcesProps &
  TranslationProps &
  DispatchProps;

function SiteSurveyDialog(props: Props) {
  const { closeDialog, open, showData, t } = props;
  return (
    <Dialog fullScreen open={open} onClose={closeDialog}>
      {showData ? (
        <>
          <DialogContent>
            <Map />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeDialog}>{t('general.action.close')}</Button>
            <Button color='primary' onClick={closeDialog}>
              {t('general.action.save')}
            </Button>
          </DialogActions>
        </>
      ) : (
        <Initializer {...props} />
      )}
    </Dialog>
  );
}

export default connect(
  // -- map state to props (get full dialog state)
  (state: RootState) => ({
    ...state.dialogs.siteSurvey,
    dataSources: selectInitDataSources(state),
  }),
  // -- map dispatch to props
  (dispatch: AppDispatch) => ({
    closeDialog: () => {
      dispatch(adaptLoadedShow());
      dispatch(closeDialog());
    },
    initializeWithData: (showData: ShowData) =>
      dispatch(initializeWithData(showData)),
  })
)(withTranslation()(SiteSurveyDialog));
