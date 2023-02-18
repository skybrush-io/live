import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React, { useState } from 'react';
import { useAsyncFn } from 'react-use';

import LinearProgress from '@material-ui/core/LinearProgress';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { errorToString } from '~/error-handling';
import { useMessageHub } from '~/hooks';

const tests = [
  {
    component: 'compass',
    label: 'Calibrate compass',
    type: 'calib',
    timeout: 90 /* compass calibration may take longer */,
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
    type: 'test',
  },
];

const ProgressBar = ({ progress }) => {
  const { percentage } = progress || {};

  if (isNil(percentage)) {
    return <LinearProgress value={null} variant='indeterminate' />;
  } else if (
    typeof percentage === 'number' &&
    percentage >= 0 &&
    percentage < 100
  ) {
    return <LinearProgress value={percentage} variant='determinate' />;
  } else {
    return null;
  }
};

ProgressBar.propTypes = {
  progress: PropTypes.shape({
    percentage: PropTypes.number,
    message: PropTypes.string,
  }),
};

const UAVTestButton = ({ component, label, timeout, type, uavId }) => {
  const messageHub = useMessageHub();
  const [progress, setProgress] = useState(null);

  const [state, start] = useAsyncFn(async () => {
    // TODO(ntamas): use the proper UAV-TEST messages designated for this
    await messageHub.sendCommandRequest(
      {
        uavId,
        command: type === 'test' ? 'test' : 'calib',
        args: [String(component)],
      },
      { onProgress: setProgress, timeout }
    );
    return true;
  }, [messageHub, setProgress]);

  return (
    <ListItem button onClick={start}>
      <StatusLight
        status={
          state.loading
            ? 'next'
            : state.error
            ? 'error'
            : isNil(state.value)
            ? 'off'
            : state.value
            ? 'success'
            : 'error'
        }
      />
      <ListItemText
        primary={label}
        secondary={
          state.error ? (
            errorToString(state.error)
          ) : progress ? (
            <ProgressBar progress={progress} />
          ) : null
        }
      />
    </ListItem>
  );
};

UAVTestButton.propTypes = {
  component: PropTypes.string,
  label: PropTypes.string,
  uavId: PropTypes.string,
  timeout: PropTypes.number,
  type: PropTypes.oneOf(['calib', 'test']),
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
