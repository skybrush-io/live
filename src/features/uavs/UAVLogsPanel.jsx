import isNil from 'lodash-es/isNil';
import prettyBytes from 'pretty-bytes';
import PropTypes from 'prop-types';
import React, { memo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useAsyncRetry } from 'react-use';

import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import { makeStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Error from '@material-ui/icons/Error';
import GetApp from '@material-ui/icons/GetApp';
import Save from '@material-ui/icons/Save';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import LargeProgressIndicator from '@skybrush/mui-components/lib/LargeProgressIndicator';
import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { listOf } from '~/components/helpers/lists';
import { showNotification } from '~/features/snackbar/ToastNotificationManager';
import { MessageSemantics } from '~/features/snackbar/types';
import {
  getLogDownloadState,
  initiateLogDownload,
  LogDownloadStatus,
  retrieveDownloadedLog,
  setLogDownloadError,
  setLogDownloadProgress,
  storeDownloadedLog,
} from '~/features/uavs/log-download';
import useMessageHub from '~/hooks/useMessageHub';
import { describeFlightLogKind } from '~/model/enums';
import { convertFlightLogToBlob } from '~/model/flight-logs';
import { writeBlobToFile } from '~/utils/filesystem';
import { formatUnixTimestamp } from '~/utils/formatting';

import ListItemProgressBar from './ListItemProgressBar';

const SEPARATOR = ' · ';

const useStyles = makeStyles(
  (theme) => ({
    progress: {
      // Make sure that the progress bar (if any) has exactly the same height
      // as the secondary text
      padding: theme.spacing(1, 0),
    },
  }),
  {
    name: 'UAVLogListItem',
  }
);

const saveLogToFile = (log) => {
  const { filename, blob } = convertFlightLogToBlob(log);
  writeBlobToFile(blob, filename);
};

const UAVLogListItem = ({ id, kind, size, timestamp, uavId }) => {
  /* Hooks */

  const dispatch = useDispatch();
  const messageHub = useMessageHub();
  const classes = useStyles();

  const downloadState = useSelector(getLogDownloadState(uavId, id));
  const log = useSelector(retrieveDownloadedLog(uavId, id));

  const download = useCallback(() => {
    dispatch(initiateLogDownload(uavId, id));
    messageHub.query
      .getFlightLog(uavId, id, {
        onProgress({ progress }) {
          dispatch(setLogDownloadProgress(uavId, id, progress));
        },
      })
      .then((log) => {
        dispatch(storeDownloadedLog(uavId, id, log));
        dispatch(
          showNotification({
            message: `Log ${id} of UAV ${uavId} downloaded successfully.`,
            semantics: MessageSemantics.SUCCESS,
            buttons: [{ label: 'Save', action: () => saveLogToFile(log) }],
            timeout: 20000,
          })
        );
      })
      .catch(({ message }) => {
        dispatch(
          showNotification({
            message: `Couldn't download log ${id} of UAV ${uavId}: ${message}`,
            semantics: MessageSemantics.ERROR,
            buttons: [{ label: 'Retry', action: download }],
            timeout: 20000,
          })
        );
        dispatch(setLogDownloadError(uavId, id, message));
      });
  }, [dispatch, id, messageHub, uavId]);

  const save = useCallback(() => {
    saveLogToFile(log);
  }, [log]);

  /* Display */

  const primaryParts = [];
  const secondaryParts = [];

  if (!isNil(id)) {
    primaryParts.push(id);
  }

  primaryParts.push(
    isNil(timestamp) ? 'Date unknown' : formatUnixTimestamp(timestamp)
  );

  if (downloadState?.status === LogDownloadStatus.ERROR) {
    secondaryParts.push(downloadState?.error);
  } else {
    secondaryParts.push(describeFlightLogKind(kind));
    if (!isNil(size)) {
      secondaryParts.push(prettyBytes(size));
    }
  }

  const secondaryComponent =
    downloadState?.status === LogDownloadStatus.LOADING ? (
      <div className={classes.progress}>
        <ListItemProgressBar progress={downloadState.progress} />
      </div>
    ) : (
      <Typography variant='body2' color='textSecondary'>
        {secondaryParts.join(SEPARATOR)}
      </Typography>
    );

  const isLoading = downloadState?.status === LogDownloadStatus.LOADING;
  const onClick = isLoading ? undefined : log ? save : download;

  return (
    <ListItem button onClick={onClick}>
      <StatusLight
        status={
          {
            [LogDownloadStatus.LOADING]: 'next',
            [LogDownloadStatus.ERROR]: 'error',
            [LogDownloadStatus.SUCCESS]: 'success',
          }[downloadState?.status] ?? 'off'
        }
      />
      <ListItemText
        disableTypography
        primary={
          <Typography variant='body2'>
            {primaryParts.join(SEPARATOR)}
          </Typography>
        }
        secondary={secondaryComponent}
      />
      <ListItemSecondaryAction>
        <IconButton edge='end' disabled={isLoading} onClick={onClick}>
          {downloadState?.status === LogDownloadStatus.SUCCESS ? (
            <Save />
          ) : (
            <GetApp />
          )}
        </IconButton>
      </ListItemSecondaryAction>
    </ListItem>
  );
};

UAVLogListItem.propTypes = {
  id: PropTypes.string,
  kind: PropTypes.string,
  size: PropTypes.number,
  timestamp: PropTypes.number,
  uavId: PropTypes.string,
};

const UAVLogList = listOf(
  (item, props) => (
    <UAVLogListItem key={item.id} uavId={props.uavId} {...item} />
  ),
  {
    dataProvider: 'items',
    backgroundHint: 'No logs found',
  }
);

const UAVLogsPanel = memo(({ uavId }) => {
  const messageHub = useMessageHub();
  const state = useAsyncRetry(
    () => (uavId ? messageHub.query.getFlightLogList(uavId) : {}),
    [messageHub, uavId]
  );

  if (state.error && !state.loading) {
    return (
      <BackgroundHint
        icon={<Error />}
        text='Error while loading log list'
        button={<Button onClick={state.retry}>Try again</Button>}
      />
    );
  }

  if (state.loading) {
    return <LargeProgressIndicator fullHeight label='Retrieving log list...' />;
  }

  if (!Array.isArray(state.value)) {
    return (
      <BackgroundHint
        text='Log list not loaded yet'
        button={<Button onClick={state.retry}>Try again</Button>}
      />
    );
  }

  return <UAVLogList dense uavId={uavId} items={state.value} />;
});

UAVLogsPanel.propTypes = {
  uavId: PropTypes.string,
};

export default UAVLogsPanel;
