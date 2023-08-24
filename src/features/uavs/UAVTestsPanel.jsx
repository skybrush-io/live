import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React, { useCallback, useRef, useState } from 'react';
import { useAsyncFn } from 'react-use';

import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Zoom from '@material-ui/core/Zoom';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import Colors from '~/components/colors';
import { errorToString } from '~/error-handling';
import { useMessageHub } from '~/hooks';

import ListItemProgressBar from './ListItemProgressBar';

const tests = [
  {
    component: 'compass',
    label: 'Calibrate compass',
    type: 'calib',
    timeout: 90 /* compass calibration may take longer */,
  },
  {
    component: 'accel',
    label: 'Calibrate accelerometer',
    type: 'calib',
    timeout: 90 /* accelerometer calibration may take longer */,
  },
  {
    component: 'baro',
    label: 'Calibrate ground pressure',
    type: 'calib',
    timeout: 10,
  },
  {
    component: 'gyro',
    label: 'Calibrate gyroscope',
    type: 'calib',
    timeout: 10,
  },
  {
    component: 'level',
    label: 'Calibrate level position',
    type: 'calib',
    timeout: 10,
  },
  {
    component: 'led',
    label: 'Execute LED test',
    type: 'test',
  },
  {
    component: 'motor',
    label: 'Execute motor test',
    needsConfirmation: true,
    type: 'test',
  },
];

const UAVTestButton = ({
  component,
  label,
  needsConfirmation,
  timeout,
  type,
  uavId,
}) => {
  const messageHub = useMessageHub();

  // We can store the timeout ID of the pending confirmation in this state and
  // use it to determine whethere there is a currently pending confirmation,
  // as setTimeout returns *positive* integers only.
  // https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#return_value
  const [pendingConfirmation, setPendingConfirmation] = useState(null);
  const [progress, setProgress] = useState(null);
  const [suspended, setSuspended] = useState(false);
  const resumeCallback = useRef(null);

  const clearPendingConfirmation = useCallback(() => {
    clearTimeout(pendingConfirmation);
    setPendingConfirmation(null);
  }, [pendingConfirmation, setPendingConfirmation]);

  const askForConfirmation = useCallback(() => {
    clearPendingConfirmation();
    setPendingConfirmation(setTimeout(clearPendingConfirmation, 3000));
  }, [clearPendingConfirmation, setPendingConfirmation]);

  const giveConfirmation = useCallback(() => {
    clearPendingConfirmation();
    if (suspended) {
      resume();
    } else {
      execute();
    }
  }, [clearPendingConfirmation, execute, resume, suspended]);

  const progressHandler = useCallback(({ progress, resume, suspended }) => {
    setProgress(progress);
    setSuspended(Boolean(suspended));
    resumeCallback.current = resume;
  }, []);

  const [executionState, execute] = useAsyncFn(async () => {
    // TODO(ntamas): use the proper UAV-TEST messages designated for this
    await messageHub.sendCommandRequest(
      {
        uavId,
        command: type === 'test' ? 'test' : 'calib',
        args: [String(component)],
      },
      { onProgress: progressHandler, timeout }
    );
    return true;
  }, [messageHub, progressHandler]);

  const [, resume] = useAsyncFn(async () => {
    if (resumeCallback.current) {
      return resumeCallback.current();
    } else {
      throw new Error('No resume callback has been provided');
    }
  }, []);

  return (
    <ListItem
      button
      onClick={needsConfirmation ? askForConfirmation : giveConfirmation}
    >
      <StatusLight
        status={
          suspended
            ? 'warning'
            : executionState.loading
            ? 'next'
            : executionState.error
            ? 'error'
            : isNil(executionState.value)
            ? 'off'
            : executionState.value
            ? 'success'
            : 'error'
        }
      />
      <ListItemText
        primary={
          suspended
            ? `${progress.message || 'Operation suspended'}. Click to resume.`
            : progress && (!executionState.error || executionState.loading)
            ? `${progress.message || label}`
            : label
        }
        secondary={
          !executionState.loading && executionState.error ? (
            errorToString(executionState.error)
          ) : progress ? (
            /* Prefer progress bars even in suspended state */
            <ListItemProgressBar progress={progress} />
          ) : suspended ? (
            /* If we are suspended but we don't have progress info, show an indefinite progress bar */
            <ListItemProgressBar />
          ) : null
        }
      />
      <ListItemSecondaryAction>
        {/* TODO: Change to `Slide` from right when switching to Material UI v5,
                  as that version supports setting a `container`. */}
        <Zoom in={Boolean(pendingConfirmation)}>
          <Button
            style={{ color: Colors.seriousWarning }}
            onClick={giveConfirmation}
          >
            Confirm
          </Button>
        </Zoom>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

UAVTestButton.propTypes = {
  component: PropTypes.string,
  label: PropTypes.string,
  needsConfirmation: PropTypes.bool,
  uavId: PropTypes.string,
  timeout: PropTypes.number,
  type: PropTypes.oneOf(['calib', 'test']),
};

UAVTestButton.defaultProps = {
  needsConfirmation: false,
};

const UAVTestsPanel = ({ uavId }) => {
  return (
    <List dense>
      {tests.map(({ component, ...props }) => (
        <UAVTestButton
          key={component}
          component={component}
          uavId={uavId}
          {...props}
        />
      ))}
    </List>
  );
};

UAVTestsPanel.propTypes = {
  uavId: PropTypes.string,
};

export default UAVTestsPanel;
