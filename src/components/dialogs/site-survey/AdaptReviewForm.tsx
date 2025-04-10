import CircularProgress from '@material-ui/core/CircularProgress';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';
import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import {
  selectAdaptResult,
  selectIsShowAdaptInProgress,
  selectShowAdaptError,
} from '~/features/site-survey/selectors';
import type { AdaptResult } from '~/features/site-survey/state';
import type { RootState } from '~/store/reducers';

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

type AdaptReviewFormProps = {
  adaptResult: AdaptResult | undefined;
  error: string | undefined;
  isShowAdaptInProgress: boolean;
};

function AdaptReviewForm(props: AdaptReviewFormProps) {
  const { adaptResult, error, isShowAdaptInProgress } = props;
  const { t } = useTranslation(undefined, {
    keyPrefix: 'siteSurveyDialog.adaptReview',
  });
  const styles = useStyles();
  let content: ReactNode;
  if (isShowAdaptInProgress) {
    content = (
      <>
        {t('showAdaptInProgress')}
        <CircularProgress size={20} />
      </>
    );
  } else if (adaptResult) {
    content = (
      <div className={styles.reviewGrid}>
        <Typography variant='body1'>
          {t('form.takeoff.lengthChange')}
        </Typography>
        <Typography
          variant='body1'
          color={adaptResult.takeoffLengthChange !== 0 ? 'error' : 'primary'}
        >
          {t('form.takeoff.lengthChangeValue', {
            value: adaptResult.takeoffLengthChange,
          })}
        </Typography>
        <Typography variant='body1'>{t('form.rth.lengthChange')}</Typography>
        <Typography
          variant='body1'
          color={adaptResult.rthLengthChange !== 0 ? 'error' : 'primary'}
        >
          {t('form.rth.lengthChangeValue', {
            value: adaptResult.rthLengthChange,
          })}
        </Typography>
      </div>
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
}

const ConnectedAdaptReviewForm = connect((state: RootState) => ({
  isShowAdaptInProgress: selectIsShowAdaptInProgress(state),
  error: selectShowAdaptError(state),
  adaptResult: selectAdaptResult(state),
}))(AdaptReviewForm);

export default ConnectedAdaptReviewForm;
