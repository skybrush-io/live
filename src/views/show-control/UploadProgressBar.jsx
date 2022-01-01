import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { useThrottle } from 'react-use';

import LinearProgress from '@material-ui/core/LinearProgress';

import {
  getUploadProgress,
  isUploadInProgress,
} from '~/features/upload/selectors';

/**
 * Linear progress bar that shows the state of the current upload.
 */
const UploadProgressBar = ({ progress, running }) => {
  // Progress values are throttled because LinearProgress seems to be having
  // problems with updates being posted too frequently
  const [value, valueBuffer] = useThrottle(progress, 500);

  return (
    <LinearProgress
      variant={running ? 'buffer' : 'determinate'}
      value={value}
      valueBuffer={valueBuffer}
    />
  );
};

UploadProgressBar.propTypes = {
  progress: PropTypes.arrayOf(PropTypes.number),
  running: PropTypes.bool,
};

export default connect(
  // mapStateToProps
  (state) => ({
    progress: getUploadProgress(state),
    running: isUploadInProgress(state),
  }),
  // mapDispatchToProps
  null
)(UploadProgressBar);
