import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import PropTypes from 'prop-types';

import { StatusPill } from '@skybrush/mui-components';

import { Status } from '~/components/semantics';
import { formatIdsAndTruncateTrailingItems as formatUAVIds } from '~/utils/formatting';

/* ************************************************************************ */

const UAVStatusMiniListEntry = ({
  id,
  gone,
  label,
  onClick,
  pillWidth = 80,
  status,
  uavIds,
}) => (
  <ListItemButton key={id} disableGutters onClick={onClick}>
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
);

UAVStatusMiniListEntry.propTypes = {
  id: PropTypes.string,
  gone: PropTypes.bool,
  label: PropTypes.string,
  onClick: PropTypes.func,
  pillWidth: PropTypes.number,
  status: PropTypes.oneOf(Object.values(Status)),
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

export default UAVStatusMiniListEntry;
