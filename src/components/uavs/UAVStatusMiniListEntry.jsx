import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import PropTypes from 'prop-types';
import React from 'react';

import { Status } from '~/components/semantics';
import StatusPill from '~/components/StatusPill';
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
  <ListItem key={id} button disableGutters onClick={onClick}>
    <Box width={pillWidth}>
      <StatusPill status={status}>{label}</StatusPill>
    </Box>
    <Box width={36} mx={1}>
      <StatusPill status={Status.OFF}>{uavIds.length}</StatusPill>
    </Box>
    {formatUAVIds(uavIds, { maxCount: 5 })}
  </ListItem>
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
