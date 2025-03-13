import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import makeStyles from '@material-ui/core/styles/makeStyles';
import type { TFunction } from 'i18next';
import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  type DataSources,
  selectInitDataSources,
} from '~/features/site-survey/selectors';
import {
  closeDialog,
  initializeWithData,
  type ShowData,
  type SiteSurveyState,
} from '~/features/site-survey/state';
import type { AppDispatch, RootState } from '~/store/reducers';

import Map from './map';

const useInitializerStyles = makeStyles((theme) => ({
  box: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
}));

type TranslationProps = {
  t: TFunction;
};
type DispatchProps = {
  initializeWithData: (swarm: ShowData) => void;
  closeDialog: () => void;
};

type DataSourcesProps = { dataSources: DataSources };
type InitializerProps = TranslationProps & DispatchProps & DataSourcesProps;

/**
 * Component that lets the user initialize the site survey dialog with data from various sources.
 */
function Initializer(props: InitializerProps) {
  const {
    closeDialog,
    initializeWithData,
    t,
    dataSources: { show },
  } = props;
  const styles = useInitializerStyles();

  return (
    <Box className={styles.box}>
      <Button
        color='primary'
        disabled={show === undefined}
        onClick={() => {
          if (show) {
            initializeWithData(show);
          }
        }}
      >
        {t('siteSurveyDialog.initializer.fromShow')}
      </Button>
      <Button onClick={closeDialog}>{t('general.action.cancel')}</Button>
    </Box>
  );
}

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
            <Button onClick={closeDialog}>{t('general.action.cancel')}</Button>
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
    closeDialog: () => dispatch(closeDialog()),
    initializeWithData: (showData: ShowData) =>
      dispatch(initializeWithData(showData)),
  })
)(withTranslation()(SiteSurveyDialog));
