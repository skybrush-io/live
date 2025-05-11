import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import React, { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import type { RootState } from '~/store/reducers';

import {
  selectAdaptResult,
  selectIsShowAdaptInProgress,
  selectShowAdaptError,
} from './selectors';
import type { AdaptResult } from './state';
import { reviewInViewer } from './actions';

const useStyles = makeStyles((theme) => ({
  centered: {
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(2),
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  reviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'max-content 1fr',
    gap: theme.spacing(1),
    alignItems: 'center',
  },
}));

type AdaptReviewFormProps = Readonly<{
  adaptResult: AdaptResult | undefined;
  error: string | undefined;
  isShowAdaptInProgress: boolean;
  reviewInViewer: () => void;
}>;

const AdaptReviewForm = (props: AdaptReviewFormProps): JSX.Element => {
  const { adaptResult, error, isShowAdaptInProgress, reviewInViewer } = props;
  const { t } = useTranslation(undefined, {
    keyPrefix: 'siteSurveyDialog.adaptReview',
  });
  const styles = useStyles();
  let content: ReactNode;
  if (isShowAdaptInProgress) {
    content = (
      <>
        {t('showAdaptInProgress')}
        <CircularProgress />
      </>
    );
  } else if (adaptResult) {
    content = (
      <>
        <div className={styles.reviewGrid}>
          <Typography variant='body1'>
            {t('form.takeoff.lengthChange')}
          </Typography>
          <Typography
            variant='body1'
            color={adaptResult.takeoffLengthChange === 0 ? 'primary' : 'error'}
          >
            {t('form.takeoff.lengthChangeValue', {
              value: adaptResult.takeoffLengthChange,
            })}
          </Typography>
          <Typography variant='body1'>{t('form.rth.lengthChange')}</Typography>
          <Typography
            variant='body1'
            color={adaptResult.rthLengthChange === 0 ? 'primary' : 'error'}
          >
            {t('form.rth.lengthChangeValue', {
              value: adaptResult.rthLengthChange,
            })}
          </Typography>
        </div>
        {window.bridge && (
          <Button
            variant='contained'
            color='primary'
            onClick={() => {
              reviewInViewer();
            }}
          >
            {t('button.reviewInViewer')}
          </Button>
        )}
      </>
    );
  } else {
    content = (
      <>
        <ErrorOutlineIcon color='error' />
        {error ?? t('error.invalidState')}
      </>
    );
  }

  return <div className={styles.centered}>{content}</div>;
};

const ConnectedAdaptReviewForm = connect(
  // mapStateToProps
  (state: RootState) => ({
    isShowAdaptInProgress: selectIsShowAdaptInProgress(state),
    error: selectShowAdaptError(state),
    adaptResult: selectAdaptResult(state),
  }),
  // mapDispatchToProps
  {
    reviewInViewer,
  }
)(AdaptReviewForm);

export default ConnectedAdaptReviewForm;
