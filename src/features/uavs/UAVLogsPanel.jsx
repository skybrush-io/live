import isNil from 'lodash-es/isNil';
import prettyBytes from 'pretty-bytes';
import PropTypes from 'prop-types';
import React, { memo } from 'react';
import { useAsyncFn, useAsyncRetry } from 'react-use';

import Button from '@material-ui/core/Button';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import Error from '@material-ui/icons/Error';

import BackgroundHint from '@skybrush/mui-components/lib/BackgroundHint';
import LargeProgressIndicator from '@skybrush/mui-components/lib/LargeProgressIndicator';
import StatusLight from '@skybrush/mui-components/lib/StatusLight';

import { listOf } from '~/components/helpers/lists';
import useMessageHub from '~/hooks/useMessageHub';
import { describeFlightLogKind } from '~/model/enums';
import { convertFlightLogToBlob } from '~/model/flight-logs';
import { writeBlobToFile } from '~/utils/filesystem';
import { formatUnixTimestamp } from '~/utils/formatting';

const SEPARATOR = ' · ';

const UAVLogListItem = ({ id, kind, size, timestamp, uavId }) => {
  const primaryParts = [];
  const secondaryParts = [];

  /* Hooks */

  const messageHub = useMessageHub();

  const [executionState, execute] = useAsyncFn(async () => {
    const log = await messageHub.query.getFlightLog(uavId, id);

    // writeBlobToFile() returns a promise, but we don't return it ourselves
    // because we want the async operation to be considered as finished when
    // the download completes, not when the saving is completed.
    setImmediate(() => {
      const { filename, blob } = convertFlightLogToBlob(log);
      writeBlobToFile(blob, filename);
    });

    return true;
  }, [messageHub, uavId, id]);

  /* Display */

  if (!isNil(id)) {
    primaryParts.push(id);
  }

  primaryParts.push(
    isNil(timestamp) ? 'Date unknown' : formatUnixTimestamp(timestamp)
  );

  if (executionState.error) {
    secondaryParts.push(executionState.error);
  } else {
    secondaryParts.push(describeFlightLogKind(kind));
    if (!isNil(size)) {
      secondaryParts.push(prettyBytes(size));
    }
  }

  return (
    <ListItem button onClick={() => execute()}>
      <StatusLight
        status={
          executionState.loading
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
        primary={primaryParts.join(SEPARATOR)}
        secondary={secondaryParts.join(SEPARATOR)}
      />
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
    backgroundHint: <BackgroundHint text='No logs found' />,
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
