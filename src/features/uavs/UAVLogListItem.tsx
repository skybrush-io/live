import GetApp from '@mui/icons-material/GetApp';
import Save from '@mui/icons-material/Save';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import prettyBytes from 'pretty-bytes';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';

import { makeStyles, Status } from '@skybrush/app-theme-mui';
import { StatusLight } from '@skybrush/mui-components';

import ListItemProgressBar from '~/components/progress/ListItemProgressBar';
import type { LogDownloadTaskData, TaskState } from '~/features/tasks';
import { getDownloadedLog, getTaskState, startTask } from '~/features/tasks';
import { describeFlightLogKind } from '~/model/enums';
import type { FlightLog, FlightLogMetadata } from '~/model/flight-logs';
import { convertFlightLogToBlob } from '~/model/flight-logs';
import type { AppDispatch, RootState } from '~/store/reducers';
import { writeBlobToFile } from '~/utils/filesystem';
import { formatUnixTimestamp } from '~/utils/formatting';

const SEPARATOR = ' · ';

const useStyles = makeStyles((theme) => ({
  progress: {
    padding: theme.spacing(1, 0),
  },
}));

type UAVLogListItemOwnProps = FlightLogMetadata & {
  uavId: string;
};

type UAVLogListItemStateProps = {
  log?: FlightLog;
  taskState?: TaskState;
};

type UAVLogListItemDispatchProps = {
  download: () => void;
};

type UAVLogListItemProps = UAVLogListItemOwnProps &
  UAVLogListItemStateProps &
  UAVLogListItemDispatchProps;

const UAVLogListItem = memo(
  ({
    download,
    id,
    kind,
    log,
    size,
    taskState,
    timestamp,
  }: UAVLogListItemProps) => {
    const { t } = useTranslation();
    const classes = useStyles();

    const progress = taskState?.progress;

    let status = Status.OFF;
    if (taskState?.status === 'error') {
      status = Status.ERROR;
    } else if (taskState?.status === 'running') {
      status = Status.NEXT;
    } else if (log !== undefined) {
      status = Status.SUCCESS;
    }

    const save = useCallback(() => {
      if (log) {
        const { filename, blob } = convertFlightLogToBlob(log);
        void writeBlobToFile(blob, filename);
      }
    }, [log]);

    const onClick =
      taskState?.status === 'running' ? undefined : log ? save : download;

    const primaryParts: string[] = [
      id,
      timestamp === undefined ? 'Date unknown' : formatUnixTimestamp(timestamp),
    ];
    const secondaryParts: string[] = [];

    if (taskState?.status === 'error') {
      if (taskState.error !== undefined) {
        secondaryParts.push(taskState.error);
      }
    } else {
      secondaryParts.push(describeFlightLogKind(kind, t));
      if (size !== undefined) {
        secondaryParts.push(prettyBytes(size));
      }
    }

    const secondaryComponent =
      taskState?.status === 'running' ? (
        <div className={classes.progress}>
          <ListItemProgressBar progress={progress} />
        </div>
      ) : (
        <Typography variant='body2' color='textSecondary'>
          {secondaryParts.join(SEPARATOR)}
        </Typography>
      );

    const saveOrDownloadButton = (
      <IconButton
        edge='end'
        disabled={onClick === undefined}
        onClick={onClick}
        size='large'
      >
        {log !== undefined ? <Save /> : <GetApp />}
      </IconButton>
    );

    return (
      <ListItem disablePadding secondaryAction={saveOrDownloadButton}>
        <ListItemButton onClick={onClick}>
          <StatusLight status={status} />
          <ListItemText
            disableTypography
            primary={
              <Typography variant='body2'>
                {primaryParts.join(SEPARATOR)}
              </Typography>
            }
            secondary={secondaryComponent}
          />
        </ListItemButton>
      </ListItem>
    );
  }
);

const ConnectedUAVLogListItem = connect(
  (state: RootState, ownProps: UAVLogListItemOwnProps) => {
    const { uavId, id } = ownProps;
    const taskData: LogDownloadTaskData = {
      uavId,
      type: 'log-download',
      taskId: id,
    };
    const taskState = getTaskState(state, taskData);

    return {
      log: getDownloadedLog(state, taskData),
      taskState,
    };
  },
  (dispatch: AppDispatch, ownProps: UAVLogListItemOwnProps) => ({
    download() {
      void dispatch(
        startTask({
          uavId: ownProps.uavId,
          type: 'log-download',
          taskId: ownProps.id,
          params: { logId: ownProps.id },
        })
      );
    },
  })
)(UAVLogListItem);

export default ConnectedUAVLogListItem;
