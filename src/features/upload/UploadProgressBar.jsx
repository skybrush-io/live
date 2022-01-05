import React from 'react';
import { useSelector } from 'react-redux';
import { useThrottle } from 'react-use';

import LinearProgress from '@material-ui/core/LinearProgress';

import { getUploadProgress, isUploadInProgress } from './selectors';

/**
 * Linear progress bar that shows the state of the current upload.
 */
const UploadProgressBar = () => {
  const progress = useSelector(getUploadProgress);
  const running = useSelector(isUploadInProgress);

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

export default UploadProgressBar;
