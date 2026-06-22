/* eslint-disable @eslint-react/set-state-in-effect */
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Zoom from '@mui/material/Zoom';
import { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { Status } from '@skybrush/app-theme-mui';
import { StatusLight } from '@skybrush/mui-components';

import Colors from '~/components/colors';
import type { UAVTestTaskData, UAVTestTaskState } from '~/features/tasks';
import { getTaskState, resumeTask, startTask } from '~/features/tasks';
import type { AppDispatch, RootState } from '~/store/reducers';

import { COMPASS_CALIB_TIMEOUT } from './constants';
import ListItemProgressBar from './ListItemProgressBar';

type UAVTestType = 'calib' | 'test';

type UAVTestItem = {
  component: string;
  label: string;
  type: UAVTestType;
  timeout?: number;
  needsConfirmation?: boolean;
};

const tests: UAVTestItem[] = [
  {
    component: 'compass',
    label: 'Calibrate compass',
    type: 'calib',
    timeout: COMPASS_CALIB_TIMEOUT,
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
    component: 'pyro',
    label: 'Execute pyro test',
    needsConfirmation: true,
    type: 'test',
  },
  {
    component: 'motor',
    label: 'Execute motor test',
    needsConfirmation: true,
    type: 'test',
  },
];

type UAVTestButtonOwnProps = {
  component: string;
  label: string;
  needsConfirmation?: boolean;
  timeout?: number;
  type: UAVTestType;
  uavId?: string;
};

type UAVTestButtonStateProps = {
  task?: UAVTestTaskState;
};

type UAVTestButtonDispatchProps = {
  resume: () => void;
  start: () => void;
};

type UAVTestButtonProps = UAVTestButtonOwnProps &
  UAVTestButtonStateProps &
  UAVTestButtonDispatchProps;

const UAVTestButton = (props: UAVTestButtonProps) => {
  const {
    label,
    needsConfirmation = false,
    resume,
    start,
    task,
    uavId,
  } = props;
  // We can store the timeout ID of the pending confirmation in this state and
  // use it to determine whether there is a currently pending confirmation,
  // as setTimeout returns *positive* integers only.
  // https://developer.mozilla.org/en-US/docs/Web/API/setTimeout#return_value
  const [pendingConfirmation, setPendingConfirmation] = useState<
    ReturnType<typeof setTimeout> | undefined
  >();

  const clearPendingConfirmation = useCallback(() => {
    clearTimeout(pendingConfirmation);
    setPendingConfirmation(undefined);
  }, [pendingConfirmation]);

  useEffect(() => {
    clearPendingConfirmation();
  }, [clearPendingConfirmation, uavId]);

  const askForConfirmation = useCallback(() => {
    clearPendingConfirmation();
    setPendingConfirmation(setTimeout(clearPendingConfirmation, 3000));
  }, [clearPendingConfirmation]);

  const giveConfirmation = useCallback(() => {
    clearPendingConfirmation();
    if (task?.status === 'suspended') {
      resume();
    } else {
      start();
    }
  }, [clearPendingConfirmation, resume, start, task?.status]);

  const suspended = task?.status === 'suspended';
  const running = task?.status === 'running';
  const error = task?.status === 'error';
  const success = task?.status === 'success';
  const progress = task?.progress;

  let status = Status.OFF;
  if (suspended) {
    status = Status.WARNING;
  } else if (running) {
    status = Status.NEXT;
  } else if (error) {
    status = Status.ERROR;
  } else if (success) {
    status = Status.SUCCESS;
  }

  const confirmButton = needsConfirmation ? (
    <Zoom in={Boolean(pendingConfirmation)}>
      {/* TODO: Change to `Slide` from right when switching to Material UI v5,
                as that version supports setting a `container`. */}
      <Button
        style={{ color: Colors.seriousWarning }}
        onClick={giveConfirmation}
      >
        Confirm
      </Button>
    </Zoom>
  ) : null;

  const primary = suspended
    ? `${progress?.message || 'Operation suspended'}. Click to resume.`
    : progress && (!error || running)
      ? `${progress.message || label}`
      : label;

  const secondary =
    !running && error ? (
      task?.error
    ) : progress ? (
      /* Prefer progress bars even in suspended state */
      <ListItemProgressBar progress={progress} />
    ) : suspended ? (
      /* If we are suspended but we don't have progress info, show an indefinite progress bar */
      <ListItemProgressBar />
    ) : null;

  return (
    <ListItem disablePadding secondaryAction={confirmButton}>
      <ListItemButton
        onClick={needsConfirmation ? askForConfirmation : giveConfirmation}
      >
        <StatusLight status={status} />
        <ListItemText primary={primary} secondary={secondary} />
      </ListItemButton>
    </ListItem>
  );
};

const ConnectedUAVTestButton = connect(
  (state: RootState, ownProps: UAVTestButtonOwnProps) => {
    const { uavId, component } = ownProps;
    if (uavId === undefined) {
      return { task: undefined };
    }

    const taskData: UAVTestTaskData = {
      uavId,
      type: 'uav-test',
      taskId: component,
    };
    return { task: getTaskState(state, taskData) };
  },
  (dispatch: AppDispatch, ownProps: UAVTestButtonOwnProps) => ({
    resume() {
      const { uavId, component } = ownProps;
      if (uavId === undefined) {
        return;
      }

      dispatch(
        resumeTask({
          uavId,
          type: 'uav-test',
          taskId: component,
        })
      );
    },
    start() {
      const { uavId, component, type, timeout } = ownProps;
      if (uavId === undefined) {
        return;
      }

      dispatch(
        startTask({
          uavId,
          type: 'uav-test',
          taskId: component,
          params: {
            component,
            command: type === 'test' ? 'test' : 'calib',
            timeout,
          },
        })
      );
    },
  })
)(UAVTestButton);

type UAVTestsPanelProps = {
  uavId?: string;
};

const UAVTestsPanel = ({ uavId }: UAVTestsPanelProps) => {
  return (
    <List dense>
      {tests.map(({ component, ...props }) => (
        <ConnectedUAVTestButton
          key={component}
          component={component}
          uavId={uavId}
          {...props}
        />
      ))}
    </List>
  );
};

export default UAVTestsPanel;
