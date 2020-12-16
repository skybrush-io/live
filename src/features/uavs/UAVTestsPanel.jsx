import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { useAsyncFn } from 'react-use';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '~/components/StatusLight';

import { errorToString } from '~/error-handling';
import { useMessageHub } from '~/hooks';

const tests = [
  {
    component: 'baro',
    label: 'Calibrate ground pressure',
    type: 'calib',
  },
  {
    component: 'gyro',
    label: 'Calibrate gyroscope',
    type: 'calib',
  },
  {
    component: 'level',
    label: 'Calibrate level position',
    type: 'calib',
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

const UAVTestButton = ({ component, label, type, uavId }) => {
  const messageHub = useMessageHub();

  const [state, start] = useAsyncFn(async () => {
    // TODO(ntamas): use the proper UAV-TEST messages designated for this
    await messageHub.sendCommandRequest({
      uavId,
      command: type === 'test' ? 'test' : 'calib',
      args: [String(component)],
    });
    return true;
  }, [messageHub]);

  return (
    <ListItem button onClick={start}>
      <StatusLight
        status={
          state.error
            ? 'error'
            : state.loading
            ? 'next'
            : isNil(state.value)
            ? 'off'
            : state.value
            ? 'success'
            : 'error'
        }
      />
      <ListItemText
        primary={label}
        secondary={state.error && errorToString(state.error)}
      />
    </ListItem>
  );
};

UAVTestButton.propTypes = {
  component: PropTypes.string,
  label: PropTypes.string,
  uavId: PropTypes.string,
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
