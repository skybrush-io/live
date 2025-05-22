import clsx from 'clsx';
import React, { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import CircularProgress from '@material-ui/core/CircularProgress';
import Button from '@material-ui/core/Button';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import ErrorOutlineIcon from '@material-ui/icons/ErrorOutline';

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

    // TODO: Add a `filter` to the `eslint` rule to ignore these cases globally!
    //       https://typescript-eslint.io/rules/naming-convention/#filter
    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& > p': {
      fontWeight: theme.typography.fontWeightMedium,
    },

    // eslint-disable-next-line @typescript-eslint/naming-convention
    '& > p:nth-child(odd)': {
      textAlign: 'right',
    },
  },
  changedDuration: {
    color: theme.palette.warning.main,
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
        <Typography>{t('showAdaptInProgress')}</Typography>
        <CircularProgress />
      </>
    );
  } else if (adaptResult) {
    content = (
      <>
        <div className={styles.reviewGrid}>
          <Typography>{t('form.takeoff.lengthChange')}</Typography>
          <Typography
            className={clsx(
              adaptResult.takeoffLengthChange !== 0 && styles.changedDuration
            )}
          >
            {t('form.takeoff.lengthChangeValue', {
              value: adaptResult.takeoffLengthChange,
            })}
          </Typography>
          <Typography>{t('form.rth.lengthChange')}</Typography>
          <Typography
            className={clsx(
              adaptResult.rthLengthChange !== 0 && styles.changedDuration
            )}
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
