import React from 'react';

import Box from '@material-ui/core/Box';

import LPSList from './LPSList';

const LPSPanel = () => (
  <Box display='flex' flexDirection='column' height='100%'>
    <Box height='100%' overflow='auto'>
      <LPSList />
    </Box>
  </Box>
);

export default LPSPanel;
