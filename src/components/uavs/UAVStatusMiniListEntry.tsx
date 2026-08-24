import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';

import { StatusPill } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import { formatIdsAndTruncateTrailingItems as formatUAVIds } from '~/utils/formatting';

type UAVStatusMiniListEntryProps = {
  id: string;
  gone?: boolean;
  label: string;
  onClick?: (event: React.MouseEvent) => void;
  pillWidth?: number;
  status: Status;
  uavIds: string[];
};

const UAVStatusMiniListEntry = ({
  id,
  gone,
  label,
  onClick,
  pillWidth = 80,
  status,
  uavIds,
}: UAVStatusMiniListEntryProps) => (
  <ListItem key={id} disablePadding>
    <ListItemButton
      disableGutters
      onClick={onClick ?? undefined}
      sx={{ px: 1 }}
    >
      <Box sx={{ width: pillWidth }}>
        <StatusPill hollow={gone} status={status}>
          {label}
        </StatusPill>
      </Box>
      <Box sx={{ width: 36, mx: 1 }}>
        <StatusPill status={Status.OFF}>{uavIds.length}</StatusPill>
      </Box>
      {formatUAVIds(uavIds, { maxCount: 5 })}
    </ListItemButton>
  </ListItem>
);

export default UAVStatusMiniListEntry;
