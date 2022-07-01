import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';

import Box from '@material-ui/core/Box';
import Alert from '@material-ui/lab/Alert';

import {
  getShowClockReference,
  getShowStartTimeAsString,
} from '~/features/show/selectors';
import { setStartTime, synchronizeShowSettings } from '~/features/show/slice';

const StartTimeDisplay = ({ formattedStartTime, onClearStartTime }) => (
  <Alert
    severity={formattedStartTime ? 'info' : 'warning'}
    variant='filled'
    onClose={formattedStartTime ? onClearStartTime : null}
  >
    <Box>
      {formattedStartTime ? (
        <>
          Start time is set to <strong>{formattedStartTime}</strong>
        </>
      ) : (
        'No start time is set at the moment.'
      )}
    </Box>
  </Alert>
);

StartTimeDisplay.propTypes = {
  formattedStartTime: PropTypes.string,
  onClearStartTime: PropTypes.func,
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
)(StartTimeDisplay);
