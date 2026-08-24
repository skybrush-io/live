import Error from '@mui/icons-material/Error';
import Button from '@mui/material/Button';
import { memo } from 'react';
import { useAsyncRetry } from 'react-use';

import {
  BackgroundHint,
  LargeProgressIndicator,
} from '@skybrush/mui-components';

import { listOf } from '~/components/helpers/lists';
import useMessageHub from '~/hooks/useMessageHub';
import type { FlightLogMetadata } from '~/model/flight-logs';

import UAVLogListItem from './UAVLogListItem';

type UAVLogListProps = {
  uavId: string;
  items: FlightLogMetadata[];
  dense?: boolean;
} & React.RefAttributes<HTMLUListElement>;

const UAVLogList = listOf<FlightLogMetadata, UAVLogListProps>(
  (item, { uavId }) => <UAVLogListItem key={item.id} uavId={uavId} {...item} />,
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
      uavId
        ? messageHub.query.getFlightLogList(uavId)
        : Promise.resolve(undefined),
    [messageHub, uavId]
  );

  if (uavId === undefined) {
    return <BackgroundHint text='No UAV selected' />;
  }

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

UAVLogsPanel.displayName = 'UAVLogsPanel';

export default UAVLogsPanel;
