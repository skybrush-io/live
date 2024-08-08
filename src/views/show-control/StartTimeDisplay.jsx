import PropTypes from 'prop-types';
import React from 'react';
import { Trans, withTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import Clear from '@material-ui/icons/Clear';
import Alert from '@material-ui/lab/Alert';

import {
  getShowClockReference,
  getShowStartTimeAsString,
} from '~/features/show/selectors';
import { setStartTime, synchronizeShowSettings } from '~/features/show/slice';

const StartTimeDisplay = ({ formattedStartTime, onClearStartTime, t }) => (
  <Alert
    severity={formattedStartTime ? 'info' : 'warning'}
    variant='filled'
    action={
      formattedStartTime ? (
        <Button
          color='inherit'
          startIcon={<Clear />}
          onClick={formattedStartTime ? onClearStartTime : null}
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
          components={{ strong: <strong />, formattedStartTime }}
        />
      ) : (
        t('startTimeDisplay.noStartTimeIsSet')
      )}
    </Box>
  </Alert>
);

StartTimeDisplay.propTypes = {
  formattedStartTime: PropTypes.string,
  onClearStartTime: PropTypes.func,
  t: PropTypes.func,
};

export default connect(
  // mapStateToProps
  (state) => ({
    formattedStartTime: getShowStartTimeAsString(state),
  }),
  // mapDispatchToProps
  {
    onClearStartTime: () => (dispatch, getState) => {
      const clock = getShowClockReference(getState());
      dispatch(setStartTime({ clock, time: null }));
      dispatch(synchronizeShowSettings('toServer'));
    },
  }
)(withTranslation()(StartTimeDisplay));
