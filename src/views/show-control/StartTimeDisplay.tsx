import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Clear from '@material-ui/icons/Clear';
import Alert from '@material-ui/lab/Alert';

import { clearStartTime } from '~/features/show/actions';
import { getShowStartTimeAsString } from '~/features/show/selectors';
import type { AppDispatch } from '~/store/reducers';

const StartTimeDisplay = (): JSX.Element => {
  const dispatch: AppDispatch = useDispatch();
  const formattedStartTime = useSelector(getShowStartTimeAsString);
  const { t } = useTranslation();
  return (
    <Alert
      severity={formattedStartTime ? 'info' : 'warning'}
      variant='filled'
      action={
        formattedStartTime ? (
          <Button
            color='inherit'
            startIcon={<Clear />}
            onClick={() => {
              dispatch(clearStartTime() as any);
            }}
          >
            {t('general.action.clear')}
          </Button>
        ) : null
      }
    >
      <Box>
        {formattedStartTime ? (
          <Trans
            i18nKey='startTimeDisplay.startTimeIsSetTo'
            components={{ strong: <strong /> }}
            formattedStartTime={formattedStartTime}
          />
        ) : (
          t('startTimeDisplay.noStartTimeIsSet')
        )}
      </Box>
    </Alert>
  );
};

export default StartTimeDisplay;
