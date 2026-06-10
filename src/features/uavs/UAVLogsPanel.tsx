import Error from '@mui/icons-material/Error';
import GetApp from '@mui/icons-material/GetApp';
import Save from '@mui/icons-material/Save';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import isNil from 'lodash-es/isNil';
import prettyBytes from 'pretty-bytes';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useAsyncRetry } from 'react-use';

import { makeStyles, Status } from '@skybrush/app-theme-mui';
import {
  BackgroundHint,
  LargeProgressIndicator,
  StatusLight,
} from '@skybrush/mui-components';

import { listOf } from '~/components/helpers/lists';
import { showNotification } from '~/features/snackbar/actions';
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
import type { ProgressStatus } from '~/flockwave/messages';
import useMessageHub from '~/hooks/useMessageHub';
import { describeFlightLogKind } from '~/model/enums';
import {
  convertFlightLogToBlob,
  type FlightLog,
  type FlightLogMetadata,
} from '~/model/flight-logs';
import { useAppDispatch } from '~/store/hooks';
import { writeBlobToFile } from '~/utils/filesystem';
import { formatUnixTimestamp } from '~/utils/formatting';

import ListItemProgressBar from './ListItemProgressBar';

const SEPARATOR = ' · ';

const useStyles = makeStyles((theme) => ({
  progress: {
    // Make sure that the progress bar (if any) has exactly the same height
    // as the secondary text
    padding: theme.spacing(1, 0),
  },
}));

const saveLogToFile = (log: FlightLog) => {
  const { filename, blob } = convertFlightLogToBlob(log);
  void writeBlobToFile(blob, filename);
};

type UAVLogListItemProps = FlightLogMetadata & {
  uavId: string;
};

const UAVLogListItem = ({
  id,
  kind,
  size,
  timestamp,
  uavId,
}: UAVLogListItemProps) => {
  /* Hooks */

  const dispatch = useAppDispatch();
  const messageHub = useMessageHub();
  const { t } = useTranslation();
  const classes = useStyles();

  const downloadState = useSelector(getLogDownloadState(uavId, id));
  const log = useSelector(retrieveDownloadedLog(uavId, id));

  const download = useCallback(() => {
    dispatch(initiateLogDownload(uavId, id));
    messageHub.query
      .getFlightLog(uavId, id, {
        onProgress({ progress }: ProgressStatus) {
          dispatch(setLogDownloadProgress(uavId, id, progress));
        },
      })
      .then((log) => {
        void dispatch(storeDownloadedLog(uavId, id, log));
        showNotification({
          message: `Log ${id} of UAV ${uavId} downloaded successfully.`,
          semantics: MessageSemantics.SUCCESS,
          buttons: [{ label: 'Save', action: () => saveLogToFile(log) }],
          timeout: 20000,
        });
      })
      .catch(({ message }: { message: string }) => {
        showNotification({
          message: `Couldn't download log ${id} of UAV ${uavId}: ${message}`,
          semantics: MessageSemantics.ERROR,
          buttons: [{ label: 'Retry', action: download }],
          timeout: 20000,
        });
        dispatch(setLogDownloadError(uavId, id, message));
      });
  }, [dispatch, id, messageHub, uavId]);

  const save = useCallback(() => {
    if (log) {
      saveLogToFile(log);
    }
  }, [log]);

  /* Display */

  const primaryParts: string[] = [];
  const secondaryParts: string[] = [];

  if (!isNil(id)) {
    primaryParts.push(id);
  }

  primaryParts.push(
    isNil(timestamp) ? 'Date unknown' : formatUnixTimestamp(timestamp)
  );

  if (downloadState?.status === LogDownloadStatus.ERROR) {
    secondaryParts.push(downloadState?.error);
  } else {
    secondaryParts.push(describeFlightLogKind(kind, t));
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

  const saveOrDownloadButton = (
    <IconButton edge='end' disabled={isLoading} onClick={onClick} size='large'>
      {downloadState?.status === LogDownloadStatus.SUCCESS ? (
        <Save />
      ) : (
        <GetApp />
      )}
    </IconButton>
  );

  return (
    <ListItem disablePadding secondaryAction={saveOrDownloadButton}>
      <ListItemButton onClick={onClick}>
        <StatusLight
          status={
            downloadState?.status
              ? {
                  [LogDownloadStatus.LOADING]: Status.NEXT,
                  [LogDownloadStatus.ERROR]: Status.ERROR,
                  [LogDownloadStatus.SUCCESS]: Status.SUCCESS,
                }[downloadState.status]
              : Status.OFF
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
      </ListItemButton>
    </ListItem>
  );
};

type UAVLogListProps = {
  uavId: string;
  items: FlightLogMetadata[];
  dense?: boolean;
};

const UAVLogList = listOf(
  (item: FlightLogMetadata, props: UAVLogListProps) => (
    <UAVLogListItem key={item.id} uavId={props.uavId} {...item} />
  ),
  {
    dataProvider: 'items',
    backgroundHint: 'No logs found',
  }
);

type UAVLogsPanelProps = {
  uavId?: string;
};

const UAVLogsPanel = memo(({ uavId }: UAVLogsPanelProps) => {
  const messageHub = useMessageHub();
  const state = useAsyncRetry(
    () =>
      uavId ? messageHub.query.getFlightLogList(uavId) : Promise.resolve({}),
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

  return <UAVLogList dense uavId={uavId!} items={state.value} />;
});

UAVLogsPanel.displayName = 'UAVLogsPanel';

export default UAVLogsPanel;
