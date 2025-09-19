import Box from '@mui/material/Box';
import ListItemButton from '@mui/material/ListItemButton';
import StatusPill from '@skybrush/mui-components/lib/StatusPill';
import PropTypes from 'prop-types';
import React from 'react';

import { Status } from '~/components/semantics';
import { formatIdsAndTruncateTrailingItems as formatUAVIds } from '~/utils/formatting';

/* ************************************************************************ */

const UAVStatusMiniListEntry = ({
  id,
  label,
  onClick,
  pillWidth,
  status,
  uavIds,
}) => (
  <ListItemButton key={id} disableGutters onClick={onClick}>
    <Box sx={{ width: pillWidth }}>
      <StatusPill status={status}>{label}</StatusPill>
    </Box>
    <Box sx={{ width: 36, mx: 1 }}>
      <StatusPill status={Status.OFF}>{uavIds.length}</StatusPill>
    </Box>
    {formatUAVIds(uavIds, { maxCount: 5 })}
  </ListItemButton>
);

UAVStatusMiniListEntry.propTypes = {
  id: PropTypes.string,
  label: PropTypes.string,
  onClick: PropTypes.func,
  pillWidth: PropTypes.number,
  status: PropTypes.oneOf(Object.values(Status)),
  uavIds: PropTypes.arrayOf(PropTypes.string),
};

UAVStatusMiniListEntry.defaultProps = {
  pillWidth: 80,
};

export default UAVStatusMiniListEntry;
