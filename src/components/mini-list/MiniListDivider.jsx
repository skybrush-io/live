import React from 'react';

import Box from '@material-ui/core/Box';
import Divider from '@material-ui/core/Divider';

/**
 * Divider that fits nicely in a mini list.
 */
const MiniListDivider = () => (
  <Box mx={-1} my={1}>
    <Divider />
  </Box>
);

export default MiniListDivider;
