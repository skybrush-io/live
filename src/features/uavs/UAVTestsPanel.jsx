import isNil from 'lodash-es/isNil';
import PropTypes from 'prop-types';
import React from 'react';
import { useAsyncFn } from 'react-use';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';

import StatusLight from '~/components/StatusLight';

import { useMessageHub } from '~/hooks';

const tests = [
  {
    component: 'motor',
    label: 'Motor test',
  },
  {
    component: 'led',
    label: 'LED test',
  },
];

const UAVTestButton = ({ component, label, uavId }) => {
  const messageHub = useMessageHub();

  const [state, start] = useAsyncFn(async () => {
    // TODO(ntamas): use the proper UAV-TEST messages designated for this
    await messageHub.sendCommandRequest({
      uavId,
      command: 'test',
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
      <ListItemText primary={label} />
    </ListItem>
  );
};

UAVTestButton.propTypes = {
  component: PropTypes.string,
  label: PropTypes.string,
  uavId: PropTypes.string,
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
